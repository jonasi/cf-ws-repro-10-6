import process from 'node:process';

type CliOptions = {
  url: string;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let url = 'ws://localhost:20000/connect';

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--url') {
      const value = args[i + 1];
      if (!value) {
        throw new Error('--url flag requires a value');
      }
      url = value;
      break;
    }
    if (arg.startsWith('--url=')) {
      url = arg.slice('--url='.length);
      break;
    }
  }

  return { url };
}

function timestamp(): string {
  return new Date().toISOString();
}

function log(...parts: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(timestamp(), ...parts);
}

function run(): void {
  const { url } = parseArgs();
  const socket = new WebSocket(url);

  let closedByRemote = false;

  socket.addEventListener('open', () => {
    log('connected', url);
    const payload = JSON.stringify({ type: 'auth.request' });
    socket.send(payload);
    log('sent auth.request', payload.length);
  });

  socket.addEventListener('message', (event) => {
    const data = typeof event.data === 'string' ? event.data : '[binary]';
    log('message', data.length, data.slice(0, 64));
  });

  socket.addEventListener('close', (event) => {
    closedByRemote = true;
    log('close', event.code, event.reason || '<no reason>');
  });

  socket.addEventListener('error', (event) => {
    log('error', event);
  });

  const exit = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'bye');
      log('closing socket');
    }
    setTimeout(() => process.exit(closedByRemote ? 0 : 1), 250);
  };

  process.on('SIGINT', exit);
  process.on('SIGTERM', exit);
}

run();
