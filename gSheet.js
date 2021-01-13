const {
	google
} = require("googleapis");

const spreadsheetId = "1X-503RbzfMhGhNoyyNe_Vu4R0c-c03r249YobxZ6OPM";
const totalSickDays = 5;
const totalVacationDays = 20;

async function getAllData(realName, auth) {
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

async function getRow(realName, auth) {
	const allData = await getAllData(realName, auth);
	const row = allData.data.values.filter(arr => arr[0].includes(realName));
	return row.flat();
}

async function getSickDays(username, auth) {
	const row = await getRow(username, auth);
	return totalSickDays - row[5]
}

async function getVacationDays(username, auth) {
	const row = await getRow(username, auth);
	return totalVacationDays - row[4]
}

module.exports = {
	getSickDays,
	getVacationDays
}