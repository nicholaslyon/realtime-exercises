import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";
import { Server } from "socket.io";

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

// setup socket.io server
const io = new Server(server, {});

// add listener for connection
io.on('connection', (socket) => {
  console.log(`connected: ${socket.id}`);

  // emit initial messages on connection to that socket
  socket.emit('messages:get', { msg: getMsgs() });

  // add listener for when a message is posted
  socket.on('messages:post', (data) => {
    msg.push({
      user: data.user,
      text: data.text,
      time: Date.now(),
    })

    // emit updated messages to all sockets
    io.emit('messages:get', { msg: getMsgs() });
  })

  // setup disconnect
  socket.on('disconnect', () => {
    console.log(`disconnect: ${socket.id}`);
  })
})

const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
