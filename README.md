# cf-ws-repro-10-6

This repository is a minimal reproduction for a control-frame mismatch observed when proxying a WebSocket connection through a Cloudflare Worker service binding into a Durable Object while using `wrangler dev`.

## Confirmed Requirements

The smallest scenario that currently reproduces the issue has the following pieces:

- Gateway Worker: accepts `/connect` upgrades, proxies them to `env.SERVICE.fetch(request)`, forwards message/close events between sockets, and logs the upstream `error` event (where the 1002 surfaces).
- Service Worker: a plain Worker that accepts the socket and logs inbound traffic (no Durable Object involvement).
- Client: sends a single application text frame (`"auth.request"`) immediately after connect, then only reads.

With only those components in place, running `./run.sh` reliably triggers, after ~90 seconds of idle time, the upstream failure reported by wrangler. If the gateway skips the service binding and handles the socket locally, the error does not appear, so the service hop (even without a Durable Object) is currently a necessary part of the repro:

```
[gateway] ✘ [ERROR] upstream error ErrorEvent {
[gateway]
[gateway]     filename: '',
[gateway]     message: 'Uncaught Error: WebSocket protocol error; protocolError.statusCode = 1002; protocolError.description = Received fragmented control frame',
[gateway]     lineno: 0,
[gateway]     colno: 0,
[gateway]     error: [Error: WebSocket protocol error; protocolError.statusCode = 1002; protocolError.description = Received fragmented control frame] {
[gateway]       [stack]: [Getter/Setter],
[gateway]       [message]: 'WebSocket protocol error; protocolError.statusCode = 1002; protocolError.description = Received fragmented control frame'
[gateway]     },
[gateway]     type: 'error',
[gateway]     eventPhase: 2,
[gateway]     composed: false,
[gateway]     bubbles: false,
[gateway]     cancelable: false,
[gateway]     defaultPrevented: false,
[gateway]     returnValue: true,
[gateway]     currentTarget: WebSocket { readyState: 3, url: null, protocol: '', extensions: '' },
[gateway]     target: WebSocket { readyState: 3, url: null, protocol: '', extensions: '' },
[gateway]     srcElement: WebSocket { readyState: 3, url: null, protocol: '', extensions: '' },
[gateway]     timeStamp: 0,
[gateway]     isTrusted: true,
[gateway]     cancelBubble: false,
[gateway]     NONE: 0,
[gateway]     CAPTURING_PHASE: 1,
[gateway]     AT_TARGET: 2,
[gateway]     BUBBLING_PHASE: 3
[gateway]   }
```

Empirically, at least one application frame must traverse the proxy to see the problem; if the client never sends a frame, the connection remains stable beyond the 120 second timeout window.

## Usage

```
./run.sh
```
