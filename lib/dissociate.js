'use strict';

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

const winston = require.main.require('winston');
const db = require.main.require('./src/database');

const client = require('./client');
const settings = require('./settings');

exports.onPostPurge = async (hookData) => {
	try {
		const post = hookData && hookData.post;
		if (!post || !post.pid) return;
		await dissociateAndDelete(parseInt(post.pid, 10));
	} catch (err) {
		winston.error('[plugin/b2-uploads] onPostPurge: ' + err.stack);
	}
};

async function dissociateAndDelete(pid) {
	if (!Number.isFinite(pid) || pid <= 0) return;

	const setKey = `b2-uploads:by-pid:${pid}`;
	const keys = await db.getSortedSetRange(setKey, 0, -1);
	if (!keys || !keys.length) return;

	const cfg = settings.isConfigured() ? settings.get() : null;
	const metas = await db.getObjects(keys.map(k => `b2-upload:${k}`));

	for (let i = 0; i < keys.length; i += 1) {
		const key = keys[i];
		const meta = metas[i] || {};
		const metaPid = parseInt(meta.pid, 10);
		const ownerUid = parseInt(meta.uid, 10) || 0;

		// Multi-reference safeguard: if some OTHER post became the canonical
		// reference for this key (last one wins via associate), don't nuke
		// the file — just drop it from this purged post's set.
		if (metaPid && metaPid !== pid) {
			await db.sortedSetRemove(setKey, key);
			continue;
		}

		if (cfg) {
			try {
				await client.get().send(new DeleteObjectCommand({
					Bucket: cfg.bucket,
					Key: key,
				}));
			} catch (err) {
				if (!(err && err.$metadata && err.$metadata.httpStatusCode === 404)) {
					winston.warn(`[plugin/b2-uploads] purge: B2 delete failed for ${key}: ${err.message}`);
				}
			}
		}

		await Promise.all([
			db.delete(`b2-upload:${key}`),
			db.sortedSetRemove(setKey, key),
			db.sortedSetRemove('b2-uploads:orphans', key),
			ownerUid ? db.sortedSetRemove(`b2-uploads:by-uid:${ownerUid}`, key) : Promise.resolve(),
		]);
	}

	await db.delete(setKey);
}
