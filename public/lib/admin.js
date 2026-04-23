'use strict';

/* globals $, socket */

import { save, load } from 'settings';
import * as alerts from 'alerts';

export function init() {
	const $form = $('.b2-uploads-settings');
	load('b2-uploads', $form);

	$('#save').on('click', () => {
		save('b2-uploads', $form, () => {
			socket.emit('plugins.b2-uploads.reload', {}, (err) => {
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

	$('#sweep-now').on('click', () => {
		const $btn = $('#sweep-now');
		$btn.prop('disabled', true);
		socket.emit('plugins.b2-uploads.sweepNow', {}, (err, result) => {
			$btn.prop('disabled', false);
			if (err) {
				alerts.error(err);
				return;
			}
			alerts.alert({
				type: 'success',
				title: '[[b2-uploads:maintenance.sweptTitle]]',
				message: `scanned=${result.scanned} deleted=${result.deleted} failed=${result.failed}`,
				timeout: 4000,
			});
		});
	});
}
