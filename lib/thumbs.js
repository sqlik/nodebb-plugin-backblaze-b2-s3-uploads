'use strict';

const winston = require.main.require('winston');
const db = require.main.require('./src/database');

const PATH_RE = /^\/uploads\/b2\/(.+)$/;

function keyFromThumbPath(thumbPath) {
	if (typeof thumbPath !== 'string') return null;
	const match = thumbPath.match(PATH_RE);
	if (!match) return null;
	const raw = match[1].replace(/[.,;!?)\]]+$/, '');
	try {
		return decodeURIComponent(raw);
	} catch (_) {
		return raw;
	}
}

exports.onTopicPost = async (hookData) => {
	try {
		const topic = hookData && hookData.topic;
		const post = hookData && hookData.post;
		if (!topic || !post || !post.pid) return;
		if (!Array.isArray(topic.thumbs) || !topic.thumbs.length) return;

		const mainPid = parseInt(post.pid, 10);
		if (!Number.isFinite(mainPid) || mainPid <= 0) return;

		const tid = parseInt(topic.tid, 10);
		const cid = parseInt(topic.cid, 10);
		const setKey = `b2-uploads:by-pid:${mainPid}`;
		const now = Date.now();

		for (const thumbPath of topic.thumbs) {
			const key = keyFromThumbPath(thumbPath);
			if (!key) continue;

			await db.setObject(`b2-upload:${key}`, {
				pid: mainPid,
				tid: tid,
				cid: cid,
			});
			await db.sortedSetAdd(setKey, now, key);
			await db.sortedSetRemove('b2-uploads:orphans', key);
		}
	} catch (err) {
		winston.error('[plugin/b2-uploads] onTopicPost: ' + err.stack);
	}
};
