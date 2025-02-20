import { listen } from 'nodesite.eu-local';

import { domain, port } from './constants';
import { query, ready } from './db';
import { shorten } from './shortener';

export const init = async () => {
	const { create } = listen({
		name: domain.replace(/\.+/g, ''),
		interface: 'http',
		port,
	});

	await ready;

	create('/', async (request) => {
		try {
			const fixed_url = request.uri
				.replace(/(https?)\:\/+([^\/])/, '$1://$2')
				.slice(1);

			const { pathname } = new URL(request.uri, 'a://b');

			let key = pathname.slice(1).toLowerCase();

			const link = await query('short_link')(key);

			if (link) {
				const { long_link } = link;

				return {
					statusCode: 302,
					head: {
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': '*',
						'Access-Control-Allow-Headers': '*',
						Location: long_link,
					},
				};
			}

			const url = new URL(fixed_url);

			if (url.host === domain) {
				return url.href;
			}

			return {
				statusCode: 200,
				head: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': '*',
					'Access-Control-Allow-Headers': '*',
					'Content-Type': 'text/plain',
				},
				body: await shorten(url.href),
			};
		} catch (error) {
			return {
				statusCode: 400,
				body: String(error),
			};
		}
	});
};
