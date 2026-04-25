'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require.main.require('archiver');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

const winston = require.main.require('winston');
const nconf = require.main.require('nconf');
const db = require.main.require('./src/database');
const user = require.main.require('./src/user');
const notifications = require.main.require('./src/notifications');
const events = require.main.require('./src/events');
const utils = require.main.require('./src/utils');

const client = require('./client');
const settings = require('./settings');

let originalGenerateExport = null;

exports.install = () => {
	if (originalGenerateExport) return;

	const usersAPI = require.main.require('./src/api/users');
	if (typeof usersAPI.generateExport !== 'function') {
		winston.warn('[plugin/b2-uploads] cannot patch generateExport — function missing on this NodeBB version');
		return;
	}
	originalGenerateExport = usersAPI.generateExport;

	usersAPI.generateExport = async function patchedGenerateExport(caller, args) {
		if (args && args.type === 'uploads') {
			try {
				return await runUploadsExport(caller, args);
			} catch (err) {
				if (err && /already-exporting|invalid-uid|invalid-data/.test(err.message)) {
					throw err;
				}
				winston.error('[plugin/b2-uploads] uploads export override failed, falling back to native: ' + err.stack);
				return originalGenerateExport(caller, args);
			}
		}
		return originalGenerateExport(caller, args);
	};

	winston.verbose('[plugin/b2-uploads] generateExport patched for uploads type');
};

async function runUploadsExport(caller, { uid }) {
	if (!utils.isNumber(uid) || !(parseInt(uid, 10) > 0)) {
		throw new Error('[[error:invalid-uid]]');
	}
	const lockKey = `export:${uid}uploads`;
	const count = await db.incrObjectField('locks', lockKey);
	if (count > 1) {
		throw new Error('[[error:already-exporting]]');
	}

	buildArchive(uid).then(async () => {
		await db.deleteObjectField('locks', lockKey);
		const { displayname } = await user.getUserFields(uid, ['username']);
		const n = await notifications.create({
			bodyShort: `[[notifications:uploads-exported, ${displayname}]]`,
			path: `/api/v3/users/${uid}/exports/uploads`,
			nid: `uploads:export:${uid}`,
			from: uid,
		});
		await notifications.push(n, [caller.uid]);
		await events.log({
			type: 'export:uploads',
			uid: caller.uid,
			targetUid: uid,
			ip: caller.ip,
		});
	}).catch(async (err) => {
		winston.error('[plugin/b2-uploads] uploads export build failed: ' + err.stack);
		await db.deleteObjectField('locks', lockKey).catch(() => {});
	});
}

async function buildArchive(uid) {
	const baseDir = nconf.get('base_dir');
	const archivePath = path.join(baseDir, 'build/export', `${uid}_uploads.zip`);

	await fs.promises.mkdir(path.dirname(archivePath), { recursive: true });

	const output = fs.createWriteStream(archivePath);
	const archive = archiver('zip', { zlib: { level: 9 } });

	const done = new Promise((resolve, reject) => {
		output.on('close', resolve);
		output.on('error', reject);
		archive.on('error', reject);
		archive.on('warning', (err) => {
			if (err && err.code === 'ENOENT') {
				winston.warn(`[plugin/b2-uploads] export missing file: ${err.path}`);
			} else {
				winston.warn('[plugin/b2-uploads] export warning: ' + (err && err.message));
			}
		});
	});

	archive.pipe(output);

	await user.collateUploads(uid, archive);

	const profileUploadPath = path.join(nconf.get('upload_path'), `profile/uid-${uid}`);
	if (fs.existsSync(profileUploadPath)) {
		archive.directory(profileUploadPath, 'profile');
	}

	if (settings.isConfigured()) {
		await appendB2Uploads(uid, archive);
	}

	await archive.finalize();
	await done;
}

async function appendB2Uploads(uid, archive) {
	const keys = await db.getSortedSetRange(`b2-uploads:by-uid:${uid}`, 0, -1);
	if (!keys || !keys.length) return;

	const cfg = settings.get();

	for (const key of keys) {
		try {
			const result = await client.get().send(new GetObjectCommand({
				Bucket: cfg.bucket,
				Key: key,
			}));
			const buffer = await streamToBuffer(result.Body);
			archive.append(buffer, { name: path.posix.join('b2', key) });
		} catch (err) {
			if (err && err.$metadata && err.$metadata.httpStatusCode === 404) {
				winston.warn(`[plugin/b2-uploads] export skip (missing in B2): ${key}`);
				continue;
			}
			winston.warn(`[plugin/b2-uploads] export skip ${key}: ${err.message}`);
		}
	}
}

function streamToBuffer(stream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		stream.on('data', chunk => chunks.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(chunks)));
		stream.on('error', reject);
	});
}
