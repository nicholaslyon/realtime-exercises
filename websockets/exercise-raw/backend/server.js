import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";

// these are helpers to help you deal with the binary data that websockets use
import objToResponse from "./obj-to-response.js";
import generateAcceptValue from "./generate-accept-value.js";
import parseMessage from "./parse-message.js";

let connections = [];
const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "brian",
  text: "hi",
  time: Date.now(),
});

// serve static assets
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: "./frontend",
  });
});

// setup server upgrade to socket connection
server.on('upgrade', (request, socket) => {
  if (request.headers['upgrade'] !== 'websocket') {
    // we only care about websockets
    socket.end('http/1.1 400 Bad Request');
    return;
  }

  const acceptKey = request.headers["sec-websocket-key"];
  const acceptValue = generateAcceptValue(acceptKey);
  const headers = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: WebSocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
    "Sec-WebSocket-Protocol: json",
    "\r\n",
  ];

  // finish headers (this signifies end of headers and start of data)
  socket.write(headers.join("\r\n"));

  // Immediately send client history of chat to start
  socket.write(objToResponse({ msg: getMsgs() }));

  // add new socket to connections
  connections.push(socket);

  // add listener for data coming from the client
  socket.on("data", (buffer) => {
    // parse the buffer into a message
    const message = parseMessage(buffer);

    // if there is a message...
    if (message) {
      // add it to our messages array
      msg.push({
        user: message.user,
        text: message.text,
        time: Date.now(),
      });

      // let all our connections know about this new message
      connections.forEach((s) => s.write(objToResponse({ msg: getMsgs() })));
    } else if (message === null) {
      // remove from my active connections
      socket.end();
    }
  });

  // remove a connection when that socket ends
  socket.on("end", () => {
    connections = connections.filter((s) => s !== socket);
  });
})

const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
