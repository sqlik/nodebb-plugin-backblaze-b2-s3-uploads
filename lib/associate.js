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
	if (!post || !post.pid || !post.content) return;
	const keys = extractKeys(post.content);
	if (!keys.size) return;

	for (const key of keys) {
		await db.setObject(`b2-upload:${key}`, {
			pid: post.pid,
			tid: post.tid,
			cid: post.cid,
		});
		await db.sortedSetAdd(`b2-uploads:by-pid:${post.pid}`, Date.now(), key);
	}
};

exports.associatePost = async (hookData) => {
	try {
		await exports.linkKeysToPost(hookData && hookData.post);
	} catch (err) {
		winston.error('[plugin/b2-uploads] associatePost: ' + err.stack);
	}
};
