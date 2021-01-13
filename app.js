const { App } = require("@slack/bolt");
const { WebClient, LogLevel } = require("@slack/web-api");
const { google } = require("googleapis");
//const { _ } = require("lodash");
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});
const calendarId =
  "f1v.co_tthcm1hbtv21rlpaso7pliirmo@group.calendar.google.com";
const keyFile = "credentials.json";
const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/spreadsheets",
];
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes,
});
const client = new WebClient();
const spreadsheetId = "1X-503RbzfMhGhNoyyNe_Vu4R0c-c03r249YobxZ6OPM";
const apiKey = "AIzaSyAGrbR6jSnhK8X_zkb3XH29PS3ag35pJGE";
async function findConversation(name) {
  try {
    const result = await app.client.conversations.list({
      token: process.env.SLACK_BOT_TOKEN,
    });
    for (const channel of result.channels) {
      if (channel.name === name) {
        const conversationId = await channel.id;
        console.log("Found conversation ID: " + conversationId);
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
      text: text,
    });
  } catch (error) {
    console.error(error);
  }
}
async function getName() {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.get(
    {
      spreadsheetId: spreadsheetId,
    },
    (err, res) => {
      if (err) {
        return console.log("You are an idiot 2: " + err);
      }
      // console.log(res.data.values.flat().find('Alex Braun'));
      // console.log('here', _.find(res.data.sheets, {properties: {'title': '2020 Staff Vacations'}}, null));
      // return res.data.values[0];
    }
  );
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: "2020 Staff Vacations!A5:A16",
    },
    (err, res) => {
      if (err) {
        return console.log("You are an idiot: " + err);
      }
      // console.log(res.data.values.flat().find('Alex Braun'));
      // console.log(res.data);
      return res.data.values[0];
    }
  );
}
async function createEvent(username, date, description) {
  const event = {
    end: {
      date: `${date}`,
    },
    start: {
      date: `${date}`,
    },
    description: `${description}`,
    summary: `${username}`,
  };
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.insert(
    {
      auth,
      calendarId,
      resource: event,
    },
    function (err, event) {
      if (err) {
        console.log(
          "There was an error contacting the Calendar service: " + err
        );
        return;
      }
      console.log("Event created: %s", ...event);
    }
  );
}

async function createManyEvent(username, start, end, description) {
  const event = {
    end: {
      date: `${end}`,
    },
    start: {
      date: `${start}`,
    },
    description: `${description}`,
    summary: `${username}`,
  };
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.insert(
    {
      auth,
      calendarId,
      resource: event,
    },
    function (err, event) {
      if (err) {
        console.log(
          "There was an error contacting the Calendar service: " + err
        );
        return;
      }
      console.log("Event created: %s", ...event);
    }
  );
}

function getDate() {
  var today = new Date();
  var dd = today.getDate();

  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }

  if (mm < 10) {
    mm = "0" + mm;
  }
  today = yyyy + "-" + mm + "-" + dd;
  console.log(today);
  return today;
}

app.event("app_mention", async ({ event }) => {
  try {
    const { text, user } = event;
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
      "me",
    ];
    if (hrTopics.some((r) => text.split(" ").includes(r))) {
      const combined = [hrTopics, text.split(" ")].flat();
      const word = combined.filter((w, i) => combined.indexOf(w) !== i && w);
      const author = await client.users.info({
        user: event.user,
        token: process.env.SLACK_BOT_TOKEN,
      });
      console.log("author", author);
      if (word == "me") {
        publishMessage(
          "hrbot-tests",
          `author: ${author.user.profile.real_name}`
        );
      } else if (word == "sick") {
        if (text.includes("many")) {
          publishMessage("hrbot-tests", "Sick days left");
        } else if (text.includes("set")) {
          const spl = text.split(" ");
          if (spl.length == 3) {
            const date = getDate();
            await createEvent(
              author.user.profile.real_name + " - Sick",
              date,
              "Covid 19"
            );
            publishMessage("hrbot-tests", "Your Sick day has been set");
          } else {
            console.log(spl);
            console.log("inside many");
            var parts = spl[4].split("-");
            var addEnd = parseInt(parts[2]) + 1;
            var end = parts[0] + "-" + parts[1] + "-" + addEnd;
            console.log(end);
            await createManyEvent(
              author.user.profile.real_name + " - Sick",
              spl[3],
              end,
              "Covid 19"
            );
            publishMessage("hrbot-tests", "Sick days  set");
          }
        } else {
          publishMessage(
            "hrbot-tests",
            "You can see how many sick days you have left or set a sick day by asking me"
          );
        }
      } else if (word == "vacation") {
        if (text.includes("many")) {
          publishMessage("hrbot-tests", "Vacation days left");
        } else if (text.includes("set")) {
          const spl = text.split(" ");
          if (spl.length == 3) {
            const date = getDate();
            await createEvent(
              author.user.profile.real_name + " - Vacation",
              date,
              "Hawaii"
            );
            publishMessage("hrbot-tests", "Your Vacation day has been set");
          } else {
            console.log(spl);
            console.log("inside many");
            var parts = spl[4].split("-");
            var addEnd = parseInt(parts[2]) + 1;
            var end = parts[0] + "-" + parts[1] + "-" + addEnd;
            console.log(end);
            await createManyEvent(
              author.user.profile.real_name + " - Beach",
              spl[3],
              end,
              "beach"
            );
            publishMessage("hrbot-tests", "Vacation days  set");
          }
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
getName();
//createManyVacation("karan","2021-01-18","2021-01-23");

// createEvent();
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();
