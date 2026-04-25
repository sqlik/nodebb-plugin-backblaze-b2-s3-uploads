'use strict';

const winston = require.main.require('winston');
const db = require.main.require('./src/database');

const URL_RE = /\/uploads\/b2\/([A-Za-z0-9._\-/%]+)/g;

function extractKeys(content) {
	const keys = new Set();
	if (!content) return keys;
	let m;
	while ((m = URL_RE.exec(content)) !== null) {
		const raw = m[1].replace(/[.,;!?)\]]+$/, '');
		try {
			keys.add(decodeURIComponent(raw));
		} catch (_) {
			keys.add(raw);
		}
	}
	return keys;
}

exports.linkKeysToPost = async (post) => {
	if (!post || !post.pid) return;
	const pid = parseInt(post.pid, 10);
	if (!Number.isFinite(pid) || pid <= 0) return;

	const setKey = `b2-uploads:by-pid:${pid}`;
	const newKeys = post.content ? extractKeys(post.content) : new Set();
	const previousKeys = new Set(await db.getSortedSetRange(setKey, 0, -1));

	const added = [...newKeys].filter(k => !previousKeys.has(k));
	const removed = [...previousKeys].filter(k => !newKeys.has(k));
	const stayed = [...newKeys].filter(k => previousKeys.has(k));

	const now = Date.now();

	for (const key of added) {
		await db.setObject(`b2-upload:${key}`, {
			pid: pid,
			tid: post.tid,
			cid: post.cid,
		});
		await db.sortedSetAdd(setKey, now, key);
		await db.sortedSetRemove('b2-uploads:orphans', key);
	}

	for (const key of removed) {
		await db.sortedSetRemove(setKey, key);
		const meta = await db.getObject(`b2-upload:${key}`);
		// Multi-ref: only re-orphan when this post is still the canonical
		// reference. If meta.pid points elsewhere, another post claimed it
		// (last-write-wins) — leave the file alone.
		if (meta && parseInt(meta.pid, 10) === pid) {
			await db.deleteObjectFields(`b2-upload:${key}`, ['pid', 'tid', 'cid']);
			await db.sortedSetAdd('b2-uploads:orphans', now, key);
		}
	}

	// Keep meta fresh — post may have moved categories
	for (const key of stayed) {
		await db.setObject(`b2-upload:${key}`, {
			pid: pid,
			tid: post.tid,
			cid: post.cid,
		});
	}
};

exports.associatePost = async (hookData) => {
	try {
		await exports.linkKeysToPost(hookData && hookData.post);
	} catch (err) {
		winston.error('[plugin/b2-uploads] associatePost: ' + err.stack);
	}
};
