const express = require("express");
const amqp = require("amqplib");

var channel, connection; //global variables
async function connectQueue() {
  try {
    connection = await amqp.connect("amqp://127.0.0.1:5672");
    channel = await connection.createChannel();

    await channel.assertQueue("test-queue");
  } catch (error) {
    console.log(error);
  }
}

async function getData() {
  await connectQueue();
  // send data to queue
  let consumedData;
  await channel.consume("test-queue", (data) => {
    if (data.content) {
      console.log("Queue has data");
      consumedData = JSON.parse(data.content);
    } else {
      console.log("Queue Empty");
      consumedData = { res: "Queue Empty" };
    }

    channel.ack(data);
  });
  // close the channel and connection
  await channel.close();
  await connection.close();
  return consumedData;

  // close the channel and connection
  //   await channel.close();
  //   await connection.close();
}
const app = express();
const PORT = process.env.PORT || 4002;
app.use(express.json());
app.get("/get-msg", (req, res) => {
  // data to be received
  getData()
    .then((data) => {
      console.log("Response", data);
      res.send(data);
    })
    .catch((err) => console.log(err));
});

app.listen(PORT, () => console.log("Server running at port " + PORT));
