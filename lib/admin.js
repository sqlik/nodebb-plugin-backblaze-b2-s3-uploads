'use strict';

const settings = require('./settings');

exports.renderAdminPage = (req, res) => {
	const s = settings.get();
	res.render('admin/plugins/b2-uploads', {
		title: 'Backblaze B2 Uploads',
		endpoint: s.endpoint,
		region: s.region,
		bucket: s.bucket,
		keyId: s.keyId,
		appKey: s.appKey,
		pathPrefix: s.pathPrefix,
		presignTtl: s.presignTtl,
		maxFileSize: s.maxFileSize,
		maxVideoSize: s.maxVideoSize,
		allowedTypes: s.allowedTypes,
		useBunny: s.useBunny,
		bunnyHostname: s.bunnyHostname,
		bunnyTokenKey: s.bunnyTokenKey,
		bunnyTokenTtl: s.bunnyTokenTtl,
		configured: settings.isConfigured(),
		bunnyActive: settings.isBunnyEnabled(),
	});
};
