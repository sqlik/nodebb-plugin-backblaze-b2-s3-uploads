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

exports.augmentUserCounts = async (data) => {
	try {
		const userData = data && data.userData;
		if (!userData || !userData.counts) return data;
		// `uploaded` is only populated for admin or self — match that visibility
		if (typeof userData.counts.uploaded !== 'number') return data;

		const uid = parseInt(userData.uid, 10);
		if (!uid) return data;

		const b2Count = await db.sortedSetCard(`b2-uploads:by-uid:${uid}`);
		userData.counts.uploaded = (userData.counts.uploaded || 0) + b2Count;
		return data;
	} catch (err) {
		winston.error('[plugin/b2-uploads] augmentUserCounts: ' + err.stack);
		return data;
	}
};
