'use strict';

const winston = require.main.require('winston');
const db = require.main.require('./src/database');

exports.augmentUploadsList = async (data) => {
	try {
		const uid = parseInt(data && data.res && data.res.locals && data.res.locals.uid, 10);
		if (!uid) return data;

		const keys = await db.getSortedSetRevRange(`b2-uploads:by-uid:${uid}`, 0, -1);
		if (!keys || !keys.length) return data;

		const metas = await db.getObjects(keys.map(k => `b2-upload:${k}`));
		const b2Uploads = keys.map((key, i) => {
			const meta = metas[i] || {};
			return {
				name: meta.name || key.split('/').pop(),
				url: `/uploads/b2/${key}`,
			};
		});

		data.templateData.uploads = (data.templateData.uploads || []).concat(b2Uploads);
		return data;
	} catch (err) {
		winston.error('[plugin/b2-uploads] augmentUploadsList: ' + err.stack);
		return data;
	}
};
