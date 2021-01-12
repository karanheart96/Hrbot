// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
const {google} = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const spreadsheetId = '1X-503RbzfMhGhNoyyNe_Vu4R0c-c03r249YobxZ6OPM';
const apiKey = 'AIzaSyAGrbR6jSnhK8X_zkb3XH29PS3ag35pJGE';

// All the room in the world for your code
app.event('app_home_opened', async ({ event, client, context }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Welcome to your _App's Home_* :tada:"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "This button won't do much for now but you can set up a listener for it using the `actions()` method and passing its unique `action_id`. See an example in the `examples` folder within your Bolt app."
            }
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "Click me!"
                }
              }
            ]
          }
        ]
      }
    });
  }
  catch (error) {
    console.error(error);
  }
});

async function findConversation(name) {
  try {
    // Call the conversations.list method using the built-in WebClient
    const result = await app.client.conversations.list({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN
    });

    for (const channel of result.channels) {
      if (channel.name === name) {
        const conversationId = await channel.id;

        // Print result
        console.log("Found conversation ID: " + conversationId);
        
        return conversationId;
      }
    }
  }
  catch (error) {
    console.error(error);
  }
}

async function publishMessage(channel, text) {
  try {
    // Call the chat.postMessage method using the built-in WebClient
    const foundChannel = await findConversation(channel)
    const result = await app.client.chat.postMessage({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN,
      channel: foundChannel,
      text: text
      // You could also use a blocks[] array to send richer content
    });

    // Print result, which includes information about the message (like TS)
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
}

// publishMessage('hrbot-tests', 'Mic test 123');

app.event('app_mention', async ({ event }) => {
  try {
    const {text, user} = event;
    console.log('event', event);
    console.log('text', event.text);
    console.log('user', event.user);
    const hrTopics = ['sick', 'vacation', 'holidays', 'holiday', 'birthday', 'poke', 'tea', 'time', 'paymo', 
'help']

    if (hrTopics.some(r => text.split(' ').includes(r))) {
	    const combined = [hrTopics, text.split(' ')].flat();
	    const word = combined.filter((w, i) => combined.indexOf(w) !== i && w)
	    if (word == 'sick') {
		    if (text.includes('many')) {
          publishMessage('hrbot-tests', 'Sick days left')
		    } else if (text.includes('set')) {
          publishMessage('hrbot-tests', 'Set a sick day')
		    } else {
          publishMessage('hrbot-tests', 'You can see how many sick days you have left or set a sick day by asking me')
        }
	    }
	    else if (word == 'vacation') {
		    if (text.includes('many')) {
          publishMessage('hrbot-tests', 'Vacation days left')
		  } else if (text.includes('set')) {
          publishMessage('hrbot-tests', 'Set a vacation day')
		  } else {
          publishMessage('hrbot-tests', 'You can see how many vacation days you have left or set a vacation day by asking me')
        }
	}
	else if (word == 'holiday' | word == 'holidays') {
    publishMessage('hrbot-tests', 'Holidays')
  }
	else if (word == 'birthday') {
    publishMessage('hrbot-tests', 'Birthdays')
  }
	else if (word == 'tea') {
    publishMessage('hrbot-tests', 'Tea')
  }
	else if (word == 'time' || word == 'paymo' || word == 'hours') {
    publishMessage('hrbot-tests', 'Paymo')
  }
	else if (word == 'poke') {
    publishMessage('hrbot-tests', 'poke')
  }} else {
	  publishMessage('hrbot-tests', `Sorry, I may not be able to help you with that. Try asking me something about... ${hrTopics}`);
  }
  }
  catch (error) {
    console.error(error);
  }
});

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors() {
  const sheets = google.sheets({version: 'v4'});
  sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Class Data!A2:E',
    key: process.env.API_KEY
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        console.log(`${row[0]}, ${row[4]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}

function getName() {
  const sheets = google.sheets({version: 'v4', auth: auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: '2020 Staff Vacations!A5:E',
  }, (err, res) => {
    if (err) {return console.log('You are an idiot: ' + err)}
    return res.data
  })
}

getName();

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
