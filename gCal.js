const {
	google
} = require("googleapis");

const calendarId =
	"f1v.co_tthcm1hbtv21rlpaso7pliirmo@group.calendar.google.com";

async function createEvent(summary, auth) {
	const event = {
		end: {
			date: "2021-01-14"
		},
		start: {
			date: "2021-01-14"
		},
		description: "-",
		summary
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

function createSickDayEvent(username, auth) {
	createEvent(`${username} - OOO - Sick`, auth);
}

function createVacationDayEvent(username, auth) {
	createEvent(`${username} - OOO - Vacation`, auth);
}

module.exports = {
	createSickDayEvent,
	createVacationDayEvent
}