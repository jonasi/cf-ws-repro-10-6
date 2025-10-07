export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === '/connect' && request.headers.get('upgrade') === 'websocket') {
			return handleConnect(env, request);
		}

		return new Response('bad', { status: 400 });
	},
} satisfies ExportedHandler<Env>;

export async function handleConnect(env: Env, request: Request): Promise<Response> {
	const serviceResp = await env.SERVICE.fetch(new Request(request));
	if (serviceResp.status !== 101 || !serviceResp.webSocket) {
		return new Response('bad upstream', { status: 400 });
	}

	const pair = new WebSocketPair();
	const [client, server] = Object.values(pair);
	const upstream = serviceResp.webSocket;

	server.accept();
	upstream.accept();

	server.addEventListener('message', (event) => {
		upstream.send(event.data);
	});
	upstream.addEventListener('message', (event) => {
		server.send(event.data);
	});

	server.addEventListener('close', (event) => {
		upstream.close(event.code, event.reason);
	});
	upstream.addEventListener('close', (event) => {
		server.close(event.code, event.reason);
	});

	// THIS IS NECESSARY - removing this will not cause a repro
	upstream.addEventListener('error', (error) => {
		console.error('upstream error', error);
	});

	return new Response(null, {
		status: 101,
		webSocket: client,
	});
}
