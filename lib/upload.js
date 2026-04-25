'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const winston = require.main.require('winston');
const db = require.main.require('./src/database');

const client = require('./client');
const settings = require('./settings');

const MIME_MAP = {
	jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
	webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml',
	pdf: 'application/pdf',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	txt: 'text/plain', csv: 'text/csv',
	mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
	mkv: 'video/x-matroska', m4v: 'video/x-m4v',
	zip: 'application/zip', '7z': 'application/x-7z-compressed',
};

function mimeFor(ext) {
	return MIME_MAP[(ext || '').toLowerCase()] || 'application/octet-stream';
}

function sanitizeFilename(name) {
	const base = path.basename(name || 'file');
	const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
	return (cleaned || 'file').slice(0, 80);
}

function checkType(ext) {
	const allowed = settings.getAllowedTypesArray();
	return allowed.includes((ext || '').toLowerCase());
}

function checkSize(size, ext) {
	const s = settings.get();
	const limit = settings.isVideoExt(ext) ? s.maxVideoSize : s.maxFileSize;
	return size <= limit;
}

function buildKey(prefix, originalName) {
	const safeName = sanitizeFilename(originalName);
	const hash = crypto.randomBytes(8).toString('hex');
	const d = new Date();
	const datePart = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
	const cleanPrefix = String(prefix || 'uploads').replace(/^\/+|\/+$/g, '');
	return `${cleanPrefix}/${datePart}/${hash}-${safeName}`;
}

async function uploadToB2({ filePath, originalName, uid }) {
	if (!settings.isConfigured()) {
		throw new Error('[plugin/b2-uploads] not configured (set endpoint/region/bucket/keys in ACP)');
	}

	const cfg = settings.get();
	const ext = path.extname(originalName || '').slice(1).toLowerCase();
	const stat = fs.statSync(filePath);

	if (!checkType(ext)) {
		throw new Error(`[plugin/b2-uploads] file type "${ext || '?'}" is not allowed`);
	}
	if (!checkSize(stat.size, ext)) {
		throw new Error('[plugin/b2-uploads] file exceeds configured size limit');
	}

	const key = buildKey(cfg.pathPrefix, originalName);
	const safeName = sanitizeFilename(originalName);
	const contentType = mimeFor(ext);
	const fileStream = fs.createReadStream(filePath);

	await client.get().send(new PutObjectCommand({
		Bucket: cfg.bucket,
		Key: key,
		Body: fileStream,
		ContentType: contentType,
		ContentDisposition: `inline; filename="${safeName}"`,
	}));

	const now = Date.now();
	await db.setObject(`b2-upload:${key}`, {
		uid: uid || 0,
		size: stat.size,
		name: originalName || safeName,
		type: contentType,
		uploadedAt: now,
	});
	if (uid) {
		await db.sortedSetAdd(`b2-uploads:by-uid:${uid}`, now, key);
	}
	await db.sortedSetAdd('b2-uploads:orphans', now, key);

	return {
		key,
		url: `/uploads/b2/${key}`,
		name: originalName || safeName,
	};
}

async function passthroughLocal(filename, folder, tempPath) {
	const fileModule = require.main.require('./src/file');
	const upload = await fileModule.saveFileToLocal(filename, folder, tempPath);
	return {
		url: upload.url,
		path: upload.path,
		name: filename,
	};
}

exports.uploadFile = async (data) => {
	if (!settings.isConfigured() || !data || !data.file) return data;
	const folder = data.folder || 'files';
	if (folder !== 'files') {
		const local = await passthroughLocal(data.file.name, folder, data.file.path);
		data.url = local.url;
		data.path = local.path;
		data.name = local.name;
		return data;
	}
	try {
		const result = await uploadToB2({
			filePath: data.file.path,
			originalName: data.file.name,
			uid: data.uid,
		});
		data.url = result.url;
		data.name = result.name;
		data.path = undefined;
		return data;
	} catch (err) {
		winston.error('[plugin/b2-uploads] uploadFile failed: ' + err.stack);
		throw err;
	}
};

exports.uploadImage = async (data) => {
	if (!settings.isConfigured() || !data || !data.image) return data;
	const folder = data.folder || 'files';
	if (folder !== 'files') {
		const local = await passthroughLocal(data.image.name, folder, data.image.path);
		data.url = local.url;
		data.path = local.path;
		return data;
	}
	try {
		const result = await uploadToB2({
			filePath: data.image.path,
			originalName: data.image.name,
			uid: data.uid,
		});
		data.url = result.url;
		data.path = undefined;
		return data;
	} catch (err) {
		winston.error('[plugin/b2-uploads] uploadImage failed: ' + err.stack);
		throw err;
	}
};
