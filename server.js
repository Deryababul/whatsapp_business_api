import express from "express";
import dotenv from "dotenv";
import { handleIncomingMessage }  from "./service.js";
import onGoingProcess from "./dbRepository.js";

dotenv.config();

const app = express();
app.use(express.json());

const { GRAPH_API_TOKEN, PORT } = process.env;

app.post("/webhook", async (req, res) => {
  try {
    console.log(
      "Incoming webhook messages:",
      JSON.stringify(req.body, null, 2)
    );

    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    console.log(message);
    if (message) {
      const business_phone_number_id =
        req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
        
      await handleIncomingMessage(message, business_phone_number_id);
    } else {
      console.warn("No message found in the webhook payload");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.sendStatus(500);
  }
});




app.get("/deneme", (req, res) => {
  onGoingProcess("555 555 55 55");
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});






app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === GRAPH_API_TOKEN) {
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    res.sendStatus(403);
  }
});


app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
