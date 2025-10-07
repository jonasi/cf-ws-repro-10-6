export default {
	async fetch(request) {
		const url = new URL(request.url);
		if (url.pathname === '/connect' && request.headers.get('upgrade') === 'websocket') {
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			server.accept();

			// Adding message/close/error listeners here did not alter the repro; the hang + 1002 still occurs.
			server.addEventListener('message', (event) => {
				console.log('service received message:', event.data);
			});

			return new Response(null, { status: 101, webSocket: client });
		}

		return new Response('bad', { status: 400 });
	},
} satisfies ExportedHandler<Env>;
