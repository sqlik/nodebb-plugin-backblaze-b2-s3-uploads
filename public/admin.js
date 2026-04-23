'use strict';

define('admin/plugins/b2-uploads', ['settings', 'alerts'], function (settings, alerts) {
	const Admin = {};

	Admin.init = function () {
		const $form = $('.b2-uploads-settings');
		settings.load('b2-uploads', $form);

		$('#save').on('click', function () {
			settings.save('b2-uploads', $form, function () {
				socket.emit('plugins.b2-uploads.reload', {}, function (err) {
					if (err) {
						alerts.error(err);
						return;
					}
					alerts.alert({
						type: 'success',
						title: '[[b2-uploads:saved.title]]',
						message: '[[b2-uploads:saved.message]]',
						timeout: 2500,
					});
				});
			});
		});
	};

	return Admin;
});
