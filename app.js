const {
  App
} = require("@slack/bolt");
const {
  WebClient,
  LogLevel
} = require("@slack/web-api");
const {
  google
} = require("googleapis");
const {
  _
} = require("lodash");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const calendarId =
  "f1v.co_tthcm1hbtv21rlpaso7pliirmo@group.calendar.google.com";
const keyFile = "credentials.json";
const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/spreadsheets"
];

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes
});

const client = new WebClient();
const spreadsheetId = "1X-503RbzfMhGhNoyyNe_Vu4R0c-c03r249YobxZ6OPM";
const apiKey = "AIzaSyAGrbR6jSnhK8X_zkb3XH29PS3ag35pJGE";

const totalSickDays = 5;
const totalVacationDays = 20;

async function findConversation(name) {
  try {
    const result = await app.client.conversations.list({
      token: process.env.SLACK_BOT_TOKEN
    });

    for (const channel of result.channels) {
      if (channel.name === name) {
        const conversationId = await channel.id;
        return conversationId;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function publishMessage(channel, text) {
  try {
    const foundChannel = await findConversation(channel);
    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: foundChannel,
      text: text
    });
  } catch (error) {
    console.error(error);
  }
}

async function getAllData(realName) {
  const sheets = google.sheets({
    version: "v4",
    auth
  });
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: "2020 Staff Vacations!A5:F16"
  });

  // console.log('yo', sheets.spreadsheets.values.get(
  //   {
  //     spreadsheetId: spreadsheetId,
  //     range: "2020 Staff Vacations!A5:F16"
  //   },
  //   (err, res) => {
  //     if (err) {
  //       return console.log("You are an idiot: " + err);
  //     }
  //     return res.data.values;
  //   }
  // ));
  return data;
}

async function getRow(realName) {
  // const sheets = google.sheets({ version: "v4", auth });
  // sheets.spreadsheets.get({
  //   spreadsheetId: spreadsheetId,
  // }, (err, res) => {
  //     if (err) {
  //       return console.log("You are an idiot 2: " + err);
  //     }
  //     // console.log(res.data);
  //     // console.log('here', _.find(res.data.sheets, {properties: {'title': '2020 Staff Vacations'}}, null).values);
  //     // return res.data.values[0];
  //   })
  const allData = await getAllData(realName);
  const row = allData.data.values.filter(arr => arr[0].includes(realName));
  return row.flat();
}

async function createEvent(username) {
  const event = {
    end: {
      date: "2021-01-14"
    },
    start: {
      date: "2021-01-14"
    },
    description: "Covid 19",
    summary: `${username} - Sick Leave`
  };
  const calendar = google.calendar({
    version: "v3",
    auth
  });
  calendar.events.insert({
      auth,
      calendarId,
      resource: event
    },
    function (err, event) {
      if (err) {
        console.log(
          "There was an error contacting the Calendar service: " + err
        );
        return;
      }
      console.log("Event created yo");
    }
  );
}

app.event("app_mention", async ({
  event
}) => {
  try {
    const {
      text,
      user
    } = event;

    const hrTopics = [
      "sick",
      "vacation",
      "holidays",
      "holiday",
      "birthday",
      "poke",
      "tea",
      "time",
      "paymo",
      "help",
      "me"
    ];

    if (hrTopics.some(r => text.split(" ").includes(r))) {
      const combined = [hrTopics, text.split(" ")].flat();
      const word = combined.filter((w, i) => combined.indexOf(w) !== i && w);
      const author = await client.users.info({
        user: event.user,
        token: process.env.SLACK_BOT_TOKEN
      });
      const username = author.user.profile.real_name;

      if (word == "me") {
        publishMessage("hrbot-tests", `author: ${username}`);
      } else if (word == "sick") {
        if (text.includes("many")) {
          const row = await getRow(username);
          publishMessage(
            "hrbot-tests",
            `You have ${totalSickDays - row[5]} sick day(s) remaining`
          );
        } else if (text.includes("set")) {
          await createEvent(username);
          publishMessage("hrbot-tests", "Your sick day has been set");
        } else {
          publishMessage(
            "hrbot-tests",
            "You can see how many sick days you have left or set a sick day by asking me"
          );
        }
      } else if (word == "vacation") {
        if (text.includes("many")) {
          const row = await getRow(username);
          publishMessage(
            "hrbot-tests",
            `You have ${totalVacationDays - row[4]} vacation day(s) remaining`
          );
        } else if (text.includes("set")) {
          publishMessage("hrbot-tests", "Set a vacation day");
        } else {
          publishMessage(
            "hrbot-tests",
            "You can see how many vacation days you have left or set a vacation day by asking me"
          );
        }
      } else if ((word == "holiday") | (word == "holidays")) {
        publishMessage("hrbot-tests", "Holidays");
      } else if (word == "birthday") {
        publishMessage("hrbot-tests", "Birthdays");
      } else if (word == "tea") {
        publishMessage("hrbot-tests", "Tea");
      } else if (word == "time" || word == "paymo" || word == "hours") {
        publishMessage("hrbot-tests", "Paymo");
      } else if (word == "poke") {
        publishMessage("hrbot-tests", "poke");
      }
    } else {
      publishMessage(
        "hrbot-tests",
        `Sorry, I may not be able to help you with that. Try asking me something about... ${hrTopics}`
      );
    }
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
