import express from "express";
import bodyParser from "body-parser";
import nanobuffer from "nanobuffer";
import morgan from "morgan";

// set up a limited array
const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

// feel free to take out, this just seeds the server with at least one message
msg.push({
  user: "Octopus",
  text: "Welcome all - we're back up",
  time: Date.now(),
});

// get express ready to run
const app = express();
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(express.static("frontend"));

app.get("/poll", function (request, response) {
  // use getMsgs to get messages to send back
  response.json({
    msg: getMsgs(),
  })
});

app.post("/poll", function (request, response) {
  // add a new message to the server
  // get the user and text from the request
  const { user, text } = request.body;

  // ??
  // currentId++;

  // add to msgs array
  msg.push({
    user,
    text,
    time: Date.now(),
  });

  // respond with ok
  response.json({
    status: 'ok',
  });
});

// start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});
