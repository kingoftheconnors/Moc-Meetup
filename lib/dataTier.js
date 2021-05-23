
const { Client } = require('pg');
const { connect } = require('puppeteer');
const { GoogleSpreadsheet } = require('google-spreadsheet');

var connectionString = null;
if(process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL
} else {
  try {
    configVars = require('./config')
    connectionString = configVars['database'];
  }
  catch (e) {
    console.log("WARNING: No config file or database found. All database calls will return empty");
  }
}

var client = null
if (connectionString) {
  client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

if (client) {
  client.connect();
}

async function getClassesJSON(callback) {
  let result = await client.query("SELECT c.days, c.startTime, c.endTime, c.building, c.room, c.title, c.crn, c.subject, c.level, c.term, c.hours FROM class c;");
  var meetings = []
  for (let meeting of result.rows) {

    var termSemester = meeting['term'].toString().substring(0, 4);
    switch (meeting['term'].toString().substring(4, 6)) {
      case '20':
        termSemester = 'Spring ' + termSemester;
        break;
      case '30':
        termSemester = 'Summer ' + termSemester;
        break;
      case '40':
        termSemester = 'Fall ' + termSemester;
        break;
    }
    // Return all time slots in 30 minute intervals
    meetings.push(
      {
        "name": meeting['title'],
        "crn": meeting['crn'],
        "building": meeting['building'],
        "room": meeting['room'],
        "subject": meeting['subject'],
        "level": meeting['level'],
        "term": termSemester,
        "days": meeting['days'],
        "startTime": meeting['starttime'],
        "endTime": meeting['endtime'],
        "hours": meeting['hours']
      }
    )
  }
  callback(meetings);
}

async function getClassesData(callback) {
  getClassesJSON(async function(results) {
    var meetings = []
    for (let meeting of results) {
      var start = parseInt(meeting['startTime'])
      var end = parseInt(meeting['endTime'])
      const SECONDS_PER_HALF_HOUR = 60*30
      // Return all time slots in 30 minute intervals
      for(var timeSecondsSlot = start; timeSecondsSlot <= end - SECONDS_PER_HALF_HOUR/2; timeSecondsSlot += SECONDS_PER_HALF_HOUR) {
        for(let day of meeting['days'].split(',')) {
          meetings.push(
            {
              "name": meeting['name'],
              "crn": meeting['crn'],
              "time":timeSecondsSlot,
              "building": meeting['building'],
              "room": meeting['room'],
              "subject": meeting['subject'],
              "level": meeting['level'],
              "term": meeting['term'],
              "day": day
            }
          )
        }
      }
    }
    callback(meetings);
  })
}

async function pushClassDataToSheet() {
  getClassesData(async function(meetings) {
    // Push data to sheets
    // Identifying which document we'll be accessing/reading from
    var doc = new GoogleSpreadsheet(process.env.DRIVE_FILE_ID);
    
    // Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth({
      client_email: process.env.DRIVE_API_EMAIL,
      private_key: process.env.DRIVE_API_KEY,
    });
    
    // create a sheet and set the header row
    await doc.loadInfo(); // loads document properties and worksheets
    const sheet = doc.sheetsByIndex[0];
    await sheet.clear();
    await sheet.setHeaderRow(['crn', 'name', 'subject', 'level', 'term', 'day', 'building', 'room', 'time'])
    await sheet.addRows(meetings)
  })
}

function clearClassData() {
  if(client == null) {
    return;
  }
  client.query("DELETE FROM class;", (err, res) => {
    if (err) throw err;
  });
}

async function deleteOldTerms(maxTerm) {
  if(client == null) {
    return;
  }
  await client.query("DELETE FROM class WHERE (term < $1 OR term IS NULL);", [maxTerm], (err, res) => {
    if (err) throw err;
  });
}

function insertClassRow(classTitle) {
  if(client == null) {
    return;
  }
  // Add meeting time rows
  for (let meetingTime of classTitle.Meeting) {
    client.query("INSERT INTO class(title, subject, level, hours, crn, campus, term, days, building, room, starttime, endtime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING classID;",
      [classTitle.Title, classTitle.Subject, classTitle.Level, classTitle.Hours, classTitle.CRN, classTitle.Campus, classTitle.Term, meetingTime.days, meetingTime.building, meetingTime.room, meetingTime.startTime, meetingTime.endTime], (err, res) => {
      if (err) {
        throw err;
      }
    });
  }
}

async function getSubjectWithPreviousTerm(term) {
  if(client == null) {
    return null;
  }
  let result = await client.query("SELECT Subject FROM class WHERE term < $1 OR term IS NULL LIMIT 1;", [term]);
  if(result.rows.length > 0) {
    return result.rows[0]['subject'];
  }
  else {
    return null;
  }
}

async function findUnusedSubjects(term) {
  if(client == null) {
    return [];
  }
  let result = await client.query("SELECT Subject FROM class WHERE term = $1 GROUP BY Subject;", [term]);
  var subjects = [
    "ACC","ART","ANTH","ASTR","ATTR","BIOL","BUS","ENCH","CHEM","ENCE","CLAS","COOP","COMM","ENCM",
    "CPEN","CPSC","COUN","CRMJ","ECHD","ECON","EDAS","EDUC","EDS","EDSP","EPSY","ENEE","ENGR","ENGM","ETME","ENGL",
    "ESL","ETCM","ETEM","ETR","ESC","EXCH","FIN","FREN","GNSC","GEOG","GEOL","GRK","HHP","HIST",
    "HUM","INTS","IARC","LAT","LEAD","MGT","MKT","MATH","ENME","MILS","MLNG","MOSA","MUS","MUSP","NURS","NUTR",
    "OCTH","PHIL","PHYT","PHYS","PSPS","PMBA","PSY","PUBH","REL","STEM","SOCW","SOC","SPAN","THSP","UHON","USTU","WGSS"
  ];

  function subjectNotInDatabase(subject) {
    for(i in result.rows) {
      if(result.rows[i]['subject'] == subject)
        return false
    }
    return true
  }
  var unusedSubjects = subjects.filter(subjectNotInDatabase)
  return unusedSubjects;
}

async function getClassNames(callback) {
  if(client == null) {
    callback([]);
    return;
  }
  let result = await client.query("SELECT title FROM class GROUP BY title ORDER BY title;");
  if(result.rows.length > 0) {
    callback(result.rows.map(function(dict) {return dict['title'];} ));
  }
  else {
    callback([]);
  }
}

module.exports = {
  deleteOldTerms,
  clearClassData,
  insertClassRow,
  getClassesJSON,
  pushClassDataToSheet,
  getSubjectWithPreviousTerm,
  findUnusedSubjects,
  getClassNames
}