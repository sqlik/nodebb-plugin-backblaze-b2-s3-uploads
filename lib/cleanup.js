'use strict';

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

const winston = require.main.require('winston');
const db = require.main.require('./src/database');

const client = require('./client');
const settings = require('./settings');

const BATCH_SIZE = 100;

let timer = null;

async function deleteOne(key) {
	const cfg = settings.get();
	const meta = await db.getObject(`b2-upload:${key}`);
	const ownerUid = parseInt(meta && meta.uid, 10) || 0;

	try {
		await client.get().send(new DeleteObjectCommand({
			Bucket: cfg.bucket,
			Key: key,
		}));
	} catch (err) {
		// 404 from B2 is fine — the object was already gone, db is just stale
		if (err && err.$metadata && err.$metadata.httpStatusCode === 404) {
			winston.verbose('[plugin/b2-uploads] cleanup: object missing in B2, dropping db entry: ' + key);
		} else {
			throw err;
		}
	}
	await Promise.all([
		db.delete(`b2-upload:${key}`),
		db.sortedSetRemove('b2-uploads:orphans', key),
		ownerUid ? db.sortedSetRemove(`b2-uploads:by-uid:${ownerUid}`, key) : Promise.resolve(),
	]);
}

exports.sweep = async () => {
	if (!settings.isConfigured()) return { skipped: true, reason: 'plugin not configured' };

	const cfg = settings.get();
	const cutoff = Date.now() - (cfg.cleanupAgeHours * 60 * 60 * 1000);

	let scanned = 0;
	let deleted = 0;
	let failed = 0;

	while (true) {
		const keys = await db.getSortedSetRangeByScore('b2-uploads:orphans', 0, BATCH_SIZE, '-inf', cutoff);
		if (!keys || !keys.length) break;

		for (const key of keys) {
			scanned += 1;
			try {
				const meta = await db.getObject(`b2-upload:${key}`);
				if (meta && meta.pid) {
					// Race: post saved between us reading the set and acting — drop from orphans
					await db.sortedSetRemove('b2-uploads:orphans', key);
					continue;
				}
				await deleteOne(key);
				deleted += 1;
			} catch (err) {
				failed += 1;
				winston.error('[plugin/b2-uploads] cleanup failed for ' + key + ': ' + err.stack);
			}
		}
		if (keys.length < BATCH_SIZE) break;
	}

	winston.verbose(`[plugin/b2-uploads] cleanup sweep: scanned=${scanned} deleted=${deleted} failed=${failed}`);
	return { scanned, deleted, failed };
};

exports.start = () => {
	exports.stop();
	const cfg = settings.get();
	if (!cfg.cleanupEnabled) return;

	const intervalMs = Math.max(1, cfg.cleanupIntervalHours) * 60 * 60 * 1000;
	timer = setInterval(() => {
		exports.sweep().catch(err => winston.error('[plugin/b2-uploads] cleanup tick: ' + err.stack));
	}, intervalMs);
	if (timer.unref) timer.unref();
	winston.verbose(`[plugin/b2-uploads] cleanup scheduled every ${cfg.cleanupIntervalHours}h`);
};

exports.stop = () => {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
};
