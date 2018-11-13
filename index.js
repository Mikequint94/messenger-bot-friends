'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  request = require('request'),
  PAGE_ACCESS_TOKEN = "EAAIZANhHSqH4BAI7Y9Q6EAHH9DCNSWmRw9vVTXIjW6B4ZBBASOKeLc3CYLcmoZCCFLiSUnarTkWpDFiJKblPPShtYpbHhZCnFTa7fIzKK0mWZBFwBgrXv4BbpCPy8lZB4PINyQg06vpzTORPlOAbMazKAcRzZA3mfSNl6DkMm4degZDZD";

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

const { Client } = require('pg');

let queryId = 5;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query('SELECT * FROM reminders;', (err, res) => {
  if (err) {
    throw err;
  }
  if (res.rows) {
    res.rows.forEach(row => {
      console.log(JSON.stringify(row));
    });
  }
  client.end();
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = "a4b8c15d16e23f42";

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {

  let response;
  const greetings = ['hi', 'hello', 'hola', 'sup', 'whatsup', 'yo', 'hey', 'heyy', 'heyyy', 'whats up', 'what\'s up'];
  const lovingMessages = ['i love you', '143', 'i <3 you', 'i love u', 'i love you so much'];
  let reminderText = isReminder(received_message.text.toLowerCase());
  // Check if the message contains text
  if (received_message.text) {
    if (lovingMessages.indexOf(received_message.text.toLowerCase()) !== -1) {
      response = {
        "text": `I LOVE YOU TOO!!!`
      };
    } else if (greetings.indexOf(received_message.text.toLowerCase()) !== -1) {
      response = {
        "text": greetings[Math.floor(Math.random()*(greetings.length - 1))]
      };
    } else if (reminderText) {
        response = {
          "text":  `OK.  I will remind you ${reminderText}`
        };
        // const client2 = new Client({
        //   connectionString: process.env.DATABASE_URL,
        //   ssl: true,
        // });
        queryId = queryId + 1;
        // client2.connect();
        // client2.query(`INSERT INTO reminders (id, username, task) VALUES (${queryId}, 32, '${reminderText}');`, (err, res) => {
        //   if (err) {
        //     console.log(err);
        //   }
        //   console.log(res);
        //   if (res.rows) {
        //     res.rows.forEach(row => {
        //       console.log(JSON.stringify(row));
        //     });
        //   }
        //   client2.end();
        // });
    } else {
      // Create the payload for a basic text message
      response = {
        "text": `:) You sent the message: "${received_message.text}".  <3 Now send me an image! :P`
      };
    }

  } else if (received_message.attachments) {

      // Gets the URL of the message attachment
      let attachment_url = received_message.attachments[0].payload.url;
      console.log(attachment_url);
      response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture Johnny?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes Pa Pa!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No Pa Pa!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    };

  }
  // Sends the response message
  callSendAPI(sender_psid, response);
}

function isReminder(inputText) {
  const setReminders = ['set a reminder', 'set reminder', 'remind me', 'make a reminder', 'make reminder'];
  var reminderBody = '';
  setReminders.forEach((reminderIntro) => {
    if (inputText.indexOf(reminderIntro) !== -1) {
      console.log(inputText, reminderIntro);
      reminderBody = inputText.slice(reminderIntro.length + 1);
    }
  });
  return reminderBody;
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" };
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  };

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}
