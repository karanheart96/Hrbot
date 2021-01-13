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
const request = require("request");

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
  return data;
}

async function getRow(realName) {
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
      "timesheet",
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
      } else if (word == "paymo" || word == "Paymo") {
        // Paymo!
        let {
          user: userInfo
        } = await client.users.info({
          user: event.user,
          token: process.env.SLACK_BOT_TOKEN
        });
        request.get(
          "https://app.paymoapp.com/api/projects", {
            auth: {
              user: process.env.PAYMO_API_KEY
            },
            headers: {
              Accept: "application/json"
            }
          },
          (error, response, body) => {
            if (!error) {
              // List project names
              console.log("response:", JSON.parse(body));
              JSON.parse(body).projects.forEach(project => {
                request.get(
                  `https://app.paymoapp.com/api/tasks?where=project_id=${project.id}`, {
                    auth: {
                      user: process.env.PAYMO_API_KEY
                    },
                    headers: {
                      Accept: "application/json"
                    }
                  },
                  (error, response, body) => {
                    if (!error) {
                      JSON.parse(body).tasks.forEach(task => {
                        if (task.name.includes(userInfo.real_name)) {
                          publishMessage(
                            "hrbot-tests",
                            `Project: ${project.name} - ${task.name} - taskId: *${task.id}*`
                          );
                        }
                      });
                    } else {
                      console.log(error);
                    }
                  }
                );
              });
            } else {
              console.log(error);
            }
          }
        );
        publishMessage(
          "hrbot-tests",
          "To add time to your Paymo timesheet, please type `@kyle-test timesheet | <taskId>`"
        );
      } else if (word == "timesheet") {
        const taskId = text.toLowerCase().substring(text.indexOf("|") + 2);
        let todayDate = new Date();
        const dd = String(todayDate.getDate()).padStart(2, "0");
        const mm = String(todayDate.getMonth() + 1).padStart(2, "0"); //January is 0!
        const yyyy = todayDate.getFullYear();
        todayDate = `${yyyy}-${mm}-${dd}`;

        const postData = {
          task_id: taskId,
          start_time: `${todayDate}T14:00:00Z`,
          end_time: `${todayDate}T22:00:00Z`,
          description: "Time entry created by Slackbot."
        };

        request.post({
            url: "https://app.paymoapp.com/api/entries",
            body: JSON.stringify(postData),
            headers: {
              "Content-type": "application/json",
              Accept: "application/json"
            },
            auth: {
              user: process.env.PAYMO_API_KEY
            }
          },
          (error, response, body) => {
            if (!error) {
              console.log("Hours response: ", JSON.parse(body));
              if (JSON.parse(body).message) {
                publishMessage("hrbot-tests", `${JSON.parse(body).message}`);
              } else {
                publishMessage(
                  "hrbot-tests",
                  `${JSON.parse(body).entries[0].description}`
                );
              }
            } else {
              console.log(error);
            }
          }
        );
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
