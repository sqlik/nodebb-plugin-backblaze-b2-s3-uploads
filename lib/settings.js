'use strict';

const meta = require.main.require('./src/meta');

const DEFAULTS = {
	endpoint: '',
	region: '',
	bucket: '',
	keyId: '',
	appKey: '',
	pathPrefix: 'uploads',
	presignTtl: 600,
	maxFileSize: 26214400,
	maxVideoSize: 104857600,
	allowedTypes: 'jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,mp4,webm,zip',
};

const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'mkv', 'm4v']);

let cache = { ...DEFAULTS };

exports.load = async () => {
	const stored = await meta.settings.get('b2-uploads') || {};
	cache = { ...DEFAULTS, ...stored };
	cache.presignTtl = parseInt(cache.presignTtl, 10) || DEFAULTS.presignTtl;
	cache.maxFileSize = parseInt(cache.maxFileSize, 10) || DEFAULTS.maxFileSize;
	cache.maxVideoSize = parseInt(cache.maxVideoSize, 10) || DEFAULTS.maxVideoSize;
	if (cache.presignTtl < 60) cache.presignTtl = 60;
	if (cache.presignTtl > 604800) cache.presignTtl = 604800;
	return cache;
};

exports.get = () => cache;

exports.isConfigured = () => !!(
	cache.endpoint && cache.region && cache.bucket && cache.keyId && cache.appKey
);

exports.getAllowedTypesArray = () => (cache.allowedTypes || '')
	.split(',')
	.map(s => s.trim().toLowerCase())
	.filter(Boolean);

exports.isVideoExt = ext => VIDEO_EXT.has((ext || '').toLowerCase());

exports.DEFAULTS = DEFAULTS;
