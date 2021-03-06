'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  request = require('request'),
  PAGE_ACCESS_TOKEN = "EAAIZANhHSqH4BAI7Y9Q6EAHH9DCNSWmRw9vVTXIjW6B4ZBBASOKeLc3CYLcmoZCCFLiSUnarTkWpDFiJKblPPShtYpbHhZCnFTa7fIzKK0mWZBFwBgrXv4BbpCPy8lZB4PINyQg06vpzTORPlOAbMazKAcRzZA3mfSNl6DkMm4degZDZD";
const schedule = require('node-schedule');
const chrono = require('chrono-node');
const { Client } = require('pg');
const greetings = ['hi', 'hello', 'hola', 'sup', 'whatsup', 'yo', 'hey', 'heyy', 'heyyy', 'whats up', 'what\'s up'];
const lovingMessages = ['i love you', '143', 'i <3 you', 'i love u', 'i love you so much'];
const requestReminders = ['what are my reminders?', 'what are my reminders', 'reminders list', 'tell me my reminders', 'what do I have scheduled?', 'reminders?'];
const helpRequest = ['help', 'help me', 'what can you do?', 'what can you do'];
const friendListRequest = ['start a list with friends', 'make a new friend list', 'make list with friends', 'make list with a friend', 'new friend list', 'start a new list with a friend', 'make new list', 'new list', 'make new friend list', 'start list with friend', 'start a list with a friend', 'start new list', 'start a new list', 'make a new list'];
let setListName = {};
let connectorCode = {};
let joinerSetListName = {};


// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

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

      // let relationalTable =

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
  console.log(req);
  console.log(req);
  console.log(req);
  //if this has senderID, make personal tables here
  // and also a personal relational table
  console.log(req);
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
  let senderId = sender_psid.toString();
  // Check if the message contains text
  if (received_message.text) {
    console.log('!!!!!');
    console.log(connectorCode);
    console.log('!!!!!');
    let reminderText = isReminder(received_message.text.toLowerCase());
    if (setListName[senderId]) {
      setListName[senderId] = false;
      response = {
        "text": `Very well.  Have your friend message me the following string to create the joint list.`
      };
      callSendAPI(sender_psid, response);
      let listName = received_message.text;
      let randomString = Math.random().toString(36).substring(5);
      response = {
        "text": randomString
      };
      connectorCode[randomString] = {creatorListName: listName, creatorId: senderId};
    } else if (joinerSetListName[senderId]) {
      joinerSetListName[senderId] = false;
      let newTableObject = connectorCode[Object.keys(connectorCode).find(key => connectorCode[key].joinerId === senderId)];
      newTableObject.joinerListName = received_message.text;
      console.log('*******');
      console.log(newTableObject);
      console.log('*******');
      makeSharedTable(newTableObject);
    } else if (received_message.text.length === 8 && connectorCode[received_message.text]) {
      response = {
        "text": `Great!  You successfully joined the list your friend created and labeled ${connectorCode[received_message.text].creatorListName}.\nWhat would you like to call the list? (friend's name, nickname, or objective)`
      };
      joinerSetListName[senderId] = true;
      connectorCode[received_message.text].joinerId = senderId;
      // reset connectorCode to false for this string so it can be reused
      //instead of adding onto it, now is when you need to store to database
      // then instruct on how to use and message both ppl the instructions
    } else if (received_message.text.toLowerCase().slice(0,3) === 'add') {
      let addListName = received_message.text.split('to').slice(-1)[0].split(' ')[0];
    } else if (lovingMessages.indexOf(received_message.text.toLowerCase()) !== -1) {
      response = {
        "text": `I LOVE YOU TOO!!!`
      };
      // var j = schedule.scheduleJob('32 * * * *', function(){
      //   callSendAPI(sender_psid, {
      //     "text": 'The answer to life, the universe, and everything!'
      //   });
      // });
    } else if (greetings.indexOf(received_message.text.toLowerCase()) !== -1) {
      response = {
        "text": greetings[Math.floor(Math.random()*(greetings.length - 1))]
      };
    } else if (reminderText) {
        response = {
          "text":  `OK.  I will remind you ${reminderText}`
        };
        setReminder(reminderText, senderId);
    } else if (requestReminders.indexOf(received_message.text.toLowerCase()) !== -1) {
        response = {
          "text":  readReminders(senderId)
        };
    } else if (helpRequest.indexOf(received_message.text.toLowerCase()) !== -1) {
        response = {
          "text":  'Welcome to To-Do With Friends!\nIf you\'d like to add something to your list just say remind me to ... \n To see your reminders ask "what are my reminders?" \n to start a list with a friend just say so!'
        };
    } else if (friendListRequest.indexOf(received_message.text.toLowerCase()) !== -1) {
        response = {
          "text":  'What would you like to call this list? (friend\'s name, nickname, list objective, etc.)'
        };
        setListName[senderId] = true;
    } else {
      // Create the payload for a basic text message
      response = {
        "text": `:) You sent the message: "${received_message.text}".  <3 Now send me an image! :P  or ask for help!`
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
  const setReminders = ['please remind me', 'set a reminder', 'set reminder', 'remind me', 'make a reminder', 'make reminder'];
  var reminderBody = '';
  setReminders.forEach((reminderIntro) => {
    if (inputText.indexOf(reminderIntro) !== -1) {
      console.log(inputText, reminderIntro);
      reminderBody = inputText.slice(reminderIntro.length + 1);
    }
  });
  return reminderBody;
}
function setReminder(reminderText, senderId) {
  var dateInfo = chrono.parseDate(reminderText);
  console.log('!!!!!!!!!!!!');
  console.log(dateInfo);
  console.log('!!!!!!!!!!!!');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  client.connect();
  client.query(`INSERT INTO reminderList (username, task) VALUES ('${senderId}', '${reminderText}');`, (err, res) => {
    if (err) {  console.log(err);  }
    console.log(res);
    if (res.rows) {
      res.rows.forEach(row => {
        console.log(JSON.stringify(row));
      });
    }
    client.end();
  });
}
function readReminders(senderId) {
  let response = 'Here are your reminders \n';
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  client.connect();
  client.query(`SELECT * FROM reminderList WHERE username = '${senderId}' ORDER BY id;`, (err, res) => {
    if (err) {throw err;}
    console.log(res);
    if (res.rows) {
      let listItems = '';
      res.rows.forEach(row => {
        listItems += row.task + '\n';
      });
      callSendAPI(senderId, {
        "text": listItems
      });
    }
    client.end();
  });
  return response;
}

function makeSharedTable(tableInfo) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  client.connect();
  client.query(`CREATE TABLE ${tableInfo.creatorListName}-${tableInfo.joinerListName} (
    id SERIAL PRIMARY KEY,
    username varchar(45) NOT NULL,
    task varchar(80)
  );`, (err, res) => {
    if (err) { throw err;}

    client.end();
  });
  let response = `Congrats!  You have now created a shared list called ${tableInfo.creatorListName}-${tableInfo.joinerListName}!
          \nTo add a shared To-Do, say 'add .... to ${tableInfo.creatorListName}-${tableInfo.joinerListName}'`;
  callSendAPI(tableInfo.creatorId, {
    "text": response
  });
  callSendAPI(tableInfo.joinerId, {
    "text": response
  });
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
