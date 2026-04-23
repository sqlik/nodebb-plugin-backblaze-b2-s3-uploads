'use strict';

const { S3Client } = require('@aws-sdk/client-s3');
const settings = require('./settings');

let cachedClient = null;
let cachedSig = '';

function buildSignature(s) {
	return [s.endpoint, s.region, s.keyId, s.appKey].join('|');
}

exports.get = () => {
	const s = settings.get();
	const sig = buildSignature(s);
	if (cachedClient && cachedSig === sig) return cachedClient;

	cachedClient = new S3Client({
		endpoint: s.endpoint,
		region: s.region,
		credentials: {
			accessKeyId: s.keyId,
			secretAccessKey: s.appKey,
		},
		forcePathStyle: true,
	});
	cachedSig = sig;
	return cachedClient;
};

exports.invalidate = () => {
	if (cachedClient && typeof cachedClient.destroy === 'function') {
		try { cachedClient.destroy(); } catch (_) { /* ignore */ }
	}
	cachedClient = null;
	cachedSig = '';
};
