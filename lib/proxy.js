'use strict';

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const winston = require.main.require('winston');
const db = require.main.require('./src/database');
const privileges = require.main.require('./src/privileges');

const client = require('./client');
const settings = require('./settings');

exports.handleRequest = async (req, res) => {
	if (!settings.isConfigured()) {
		return res.status(503).type('text/plain').send('B2 plugin not configured');
	}

	const raw = req.params[0] || '';
	let key;
	try {
		key = decodeURIComponent(raw);
	} catch (_) {
		return res.status(400).type('text/plain').send('Bad key');
	}
	if (!key || key.includes('..') || key.startsWith('/')) {
		return res.status(400).type('text/plain').send('Bad key');
	}

	try {
		const meta = await db.getObject(`b2-upload:${key}`);
		if (!meta) {
			return res.status(404).type('text/plain').send('Not found');
		}

		const uid = parseInt(req.uid, 10) || 0;
		const cid = parseInt(meta.cid, 10);
		const ownerUid = parseInt(meta.uid, 10);
		let allowed = false;

		if (cid) {
			allowed = await privileges.categories.can('topics:read', cid, uid);
		} else if (ownerUid && ownerUid === uid && uid > 0) {
			allowed = true;
		}

		if (!allowed) {
			return res.status(403).type('text/plain').send('Forbidden');
		}

		const cfg = settings.get();
		const cmd = new GetObjectCommand({
			Bucket: cfg.bucket,
			Key: key,
			ResponseContentDisposition: meta.name ? `inline; filename="${meta.name}"` : undefined,
			ResponseContentType: meta.type || undefined,
		});
		const url = await getSignedUrl(client.get(), cmd, { expiresIn: cfg.presignTtl });

		const browserCache = Math.max(60, cfg.presignTtl - 60);
		res.setHeader('Cache-Control', `private, max-age=${browserCache}`);
		return res.redirect(302, url);
	} catch (err) {
		winston.error('[plugin/b2-uploads] proxy error: ' + err.stack);
		return res.status(500).type('text/plain').send('Error');
	}
};
