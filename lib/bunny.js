'use strict';

const crypto = require('crypto');

const settings = require('./settings');

function toBase64Url(buf) {
	return buf.toString('base64')
		.replace(/=+$/, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

exports.signUrl = (key) => {
	const cfg = settings.get();
	const ttl = cfg.bunnyTokenTtl || cfg.presignTtl;
	const expires = Math.floor(Date.now() / 1000) + ttl;

	const path = '/' + String(key).replace(/^\/+/, '');
	const stringToHash = cfg.bunnyTokenKey + path + expires;
	const hash = crypto.createHash('md5').update(stringToHash).digest();
	const token = toBase64Url(hash);

	return {
		url: `https://${cfg.bunnyHostname}${path}?token=${token}&expires=${expires}`,
		ttl,
		expires,
	};
};
