'use strict';

const winston = require.main.require('winston');

const settings = require('./lib/settings');
const client = require('./lib/client');
const upload = require('./lib/upload');
const associate = require('./lib/associate');
const proxy = require('./lib/proxy');
const admin = require('./lib/admin');

const plugin = {};

plugin.init = async (params) => {
	const { router, middleware } = params;

	router.get('/admin/plugins/b2-uploads', middleware.admin.buildHeader, admin.renderAdminPage);
	router.get('/api/admin/plugins/b2-uploads', admin.renderAdminPage);

	router.get('/uploads/b2/*', proxy.handleRequest);

	await settings.load();
	client.invalidate();

	const sockets = require.main.require('./src/socket.io/plugins');
	sockets['b2-uploads'] = sockets['b2-uploads'] || {};
	sockets['b2-uploads'].reload = async (socket) => {
		const user = require.main.require('./src/user');
		const isAdmin = await user.isAdministrator(socket.uid);
		if (!isAdmin) throw new Error('[[error:no-privileges]]');
		await settings.load();
		client.invalidate();
		return { ok: true };
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

module.exports = plugin;
