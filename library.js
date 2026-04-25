'use strict';

const winston = require.main.require('winston');

const settings = require('./lib/settings');
const client = require('./lib/client');
const upload = require('./lib/upload');
const associate = require('./lib/associate');
const proxy = require('./lib/proxy');
const admin = require('./lib/admin');
const cleanup = require('./lib/cleanup');
const profile = require('./lib/profile');
const exporter = require('./lib/export');
const dissociate = require('./lib/dissociate');
const thumbs = require('./lib/thumbs');

const plugin = {};

plugin.init = async (params) => {
	const { router, middleware } = params;

	router.get('/admin/plugins/b2-uploads', middleware.admin.buildHeader, admin.renderAdminPage);
	router.get('/api/admin/plugins/b2-uploads', admin.renderAdminPage);

	router.get('/uploads/b2/*', proxy.handleRequest);

	await settings.load();
	client.invalidate();
	cleanup.start();
	exporter.install();

	const sockets = require.main.require('./src/socket.io/plugins');
	sockets['b2-uploads'] = sockets['b2-uploads'] || {};
	sockets['b2-uploads'].reload = async (socket) => {
		const user = require.main.require('./src/user');
		const isAdmin = await user.isAdministrator(socket.uid);
		if (!isAdmin) throw new Error('[[error:no-privileges]]');
		await settings.load();
		client.invalidate();
		cleanup.start();
		return { ok: true };
	};
	sockets['b2-uploads'].sweepNow = async (socket) => {
		const user = require.main.require('./src/user');
		const isAdmin = await user.isAdministrator(socket.uid);
		if (!isAdmin) throw new Error('[[error:no-privileges]]');
		return cleanup.sweep();
	};

	winston.verbose('[plugin/b2-uploads] initialised (configured=' + settings.isConfigured() + ')');
};

plugin.addAdminMenu = async (header) => {
	header.plugins.push({
		route: '/plugins/b2-uploads',
		icon: 'fa-cloud-upload',
		name: 'Backblaze B2 Uploads',
	});
	return header;
};

plugin.uploadFile = upload.uploadFile;
plugin.uploadImage = upload.uploadImage;
plugin.associatePost = associate.associatePost;
plugin.augmentProfileUploads = profile.augmentUploadsList;
plugin.augmentUserCounts = profile.augmentUserCounts;
plugin.onPostPurge = dissociate.onPostPurge;
plugin.onTopicPost = thumbs.onTopicPost;

module.exports = plugin;
