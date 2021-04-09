
const { Client } = require('pg');
const { connect } = require('puppeteer');

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

function saveCalendar(calendarData, calendarName, callback) {
  if(client == null) {
    callback(0);
    return;
  }
  client.query('INSERT INTO calendar(name) VALUES ($1) RETURNING calendarID;', [calendarName], (err, res) => {
    if (err) throw err;
    var calendarID = res.rows[0]['calendarid'];
    if (calendarID > 0) {
      for (var className in calendarData) {
        client.query('INSERT INTO calendarRow(calendarid, classname, timeslots) VALUES ($1, $2, $3);', [calendarID, className, calendarData[className]]);
      }
    }
    callback(calendarID);
  });
}

function loadCalendar(calendarID, callback) {
  if(client == null) {
    callback("{}");
    return;
  }
  client.query('SELECT * FROM CalendarRow WHERE calendarID=$1;', [calendarID], (err, res) => {
    if (err) throw err;
    var calendarData = {}
    for (let row of res.rows) {
      calendarData[row.classname] = row.timeslots
    }
    callback(calendarData)
  });
}

function searchCalendarsByName(name, callback) {
  if(client == null) {
    callback("[]");
    return;
  }
  client.query("SELECT * FROM Calendar WHERE LOWER(name) LIKE LOWER('%' || $1 || '%');", [name], (err, res) => {
    if (err) throw err;
    callback(res.rows)
  });
}

async function getClassData(name) {
  if(client == null) {
    return { "Name": "Placeholder", "Meeting": [{"days": 'MWF', "hours": '01:00  PM - 02:00  PM'}]};
  }
  let result = await client.query(
    "SELECT m.days, m.hours FROM class c JOIN meetingTime m ON c.classID = m.classID WHERE LOWER(c.Title) LIKE $1;",
    [name.replace(/\*/g, '%').trim().toLowerCase()]);
  var meetingDicts = []
  for(let meeting of result.rows) {
    meetingDicts.push({"days": meeting['days'], "hours": meeting['hours']})
  }
  return { "Name": name, "Meeting": meetingDicts}
}

function clearClassData() {
  if(client == null) {
    return;
  }
  client.query("DELETE FROM meetingTime;", (err, res) => {
    if (err) throw err;
  });
  client.query("DELETE FROM class;", (err, res) => {
    if (err) throw err;
  });
}

async function clearClassDataBySubjectInTerm(dirtySubject, term) {
  if(client == null) {
    return;
  }
  await client.query("DELETE FROM meetingTime WHERE classID IN (SELECT classID FROM class WHERE term = $1 AND Subject = $2);", [term, dirtySubject], (err, res) => {
    if (err) throw err;
  });
  await client.query("DELETE FROM class WHERE term = $1 AND Subject = $2;", [term, dirtySubject], (err, res) => {
    if (err) throw err;
  });
}

async function clearClassDataBySubjectAndTerm(dirtySubject, newTerm) {
  if(client == null) {
    return;
  }
  await client.query("DELETE FROM meetingTime WHERE classID IN (SELECT classID FROM class WHERE (term < $1 OR term IS NULL) AND Subject = $2);", [newTerm, dirtySubject], (err, res) => {
    if (err) throw err;
  });
  await client.query("DELETE FROM class WHERE (term < $1 OR term IS NULL) AND Subject = $2;", [newTerm, dirtySubject], (err, res) => {
    if (err) throw err;
  });
}

/*
titleLinkArray[m] = {
  Title: classes.eq(classNum).children().eq(0).find('a').text(),
  Subject: classes.eq(classNum).children().eq(1).text(),
  Level: classes.eq(classNum).children().eq(2).text(),
  Hours: classes.eq(classNum).children().eq(4).text(),
  CRN: classes.eq(classNum).children().eq(5).text(),
  Meeting: meetingTimes,
  // Meeting place & Meeting room is good information but not needed
  Campus: classes.eq(classNum).children().eq(9).text()
};
*/
function insertClassRow(classTitle) {
  if(client == null) {
    return;
  }
  client.query("INSERT INTO class(title, subject, level, hours, crn, campus, term) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING classID;",
    [classTitle.Title, classTitle.Subject, classTitle.Level, classTitle.Hours, classTitle.CRN, classTitle.Campus, classTitle.Term], (err, res) => {
    if (err) {
      throw err;
    }
    // Add meeting time rows
    for (let meetingTime of classTitle.Meeting) {
      client.query("INSERT INTO meetingTime(days, hours, classID, building, room) VALUES ($1, $2, $3, $4, $5);",
        [meetingTime.days, meetingTime.hours, res.rows[0]['classid'], meetingTime.building, meetingTime.room], (err2, res2) => {
        if (err2) throw err2;
      });
    }
  });
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
  let result = await client.query("SELECT Subject FROM class GROUP BY Subject;");
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

async function getBuildings(callback) {
  if(client == null) {
    callback([]);
    return;
  }
  let result = await client.query("SELECT building FROM meetingTime GROUP BY building ORDER BY building;");
  if(result.rows.length > 0) {
    callback(result.rows.map(function(dict) {return dict['building'];} ));
  }
  else {
    callback([]);
  }
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

/**
 * Gets date object from time string
 * All date objects use the same day,
 * with the time set to match the input string
 * String (format: "09:00 AM" )
 */
function getTimeObjectFromString(dateString) {
  var timeValues;
  if (dateString.length > 5) {
    timeValues = dateString.match(/\s*(\d+):(\d+)\s*([AP]M)/)
    // Convert to military time
    if(timeValues[3] == 'PM' && parseInt(timeValues[1]) <= 11)
      timeValues[1] = parseInt(timeValues[1]) + 12;
  } else {
    timeValues = dateString.match(/\s*(\d+):(\d+)/)
  }
  return Date.parse(`01/01/2020 ${timeValues[1]}:${timeValues[2]}`);
}

async function getRoomsInBuildingFreeDuringTime(building, timeStart, timeEnd, weekDay, callback) {
  if(client == null) {
    callback(null);
    return;
  }
  var timeS = getTimeObjectFromString(timeStart)
  var timeE = getTimeObjectFromString(timeEnd)

  // Get all rooms we know of in buliding
  let result = await client.query("SELECT room FROM meetingTime WHERE building = $1 and upper(room) != 'NONE' GROUP BY room ORDER BY room;", [building]);
  if(result.rows.length > 0) {

    // Use map to convert from format: [{room = "209"}, {room = "109"}, ...] to ["209", "109", ../]
    var allRooms = result.rows.map(function(row) { return row['room'] });

    // Get meeting times in building to filter by
    result = await client.query("SELECT hours, room FROM meetingTime WHERE building = $1 and days LIKE '%' || $2 || '%' and hours != ' - ' and upper(room) != 'NONE';", [building, weekDay]);
    if(result.rows.length > 0) {

      // Query format: [{hours: "xxx  AM - xxx  PM", room = "209"}, {hours: "yyy  AM - yyy  PM", room = "109"}, ...]
      var meetingHours = result.rows;

      // Filter rooms
      var rooms = allRooms.filter(function(room) {
          for(i in meetingHours) {
            if(meetingHours[i]['room'] == room) {
              var meetingRange = meetingHours[i]['hours'].split(' - ')
              var meetingS = getTimeObjectFromString(meetingRange[0])
              var meetingE = getTimeObjectFromString(meetingRange[1])
              // Test for if the class' beginning or end overlaps our inputted time range
              if((meetingE >= timeS && timeS >= meetingS)
              || (meetingE >= timeE && timeE >= meetingS)
              || (meetingE <= timeE && timeS <= meetingS)) {
                return false;
              }
            }
          }
          return true;
        });
      callback(rooms);
      return;
    }
  }
  callback(null);
}

async function getPresets(callback) {
  if(client == null) {
    callback({});
    return;
  }
  let result = await client.query("SELECT p.name, r.classname as classname FROM preset p LEFT OUTER JOIN presetrow r ON p.presetID = r.presetID;");
  var presetData = {}
  for (let row of result.rows) {
    if(!(row.name in presetData)) {
      presetData[row.name] = []
    }
    presetData[row.name].push(row.classname)
  }
  callback(presetData);
}

async function deleteExpiredPresets() {
  if(client == null) {
    return;
  }
  await client.query("DELETE FROM presetRow WHERE presetID IN (SELECT presetID FROM preset WHERE expirationDate < NOW());", (err, res) => {
    if (err) throw err;
  });
  await client.query("DELETE FROM preset WHERE expirationDate < NOW());", [presetName.trim()], (err, res) => {
    if (err) throw err;
  });
}

async function deletePreset(presetName) {
  if(client == null) {
    return;
  }
  await client.query("DELETE FROM presetRow WHERE presetID IN (SELECT presetID FROM preset WHERE name = $1);", [presetName], (err, res) => {
    if (err) throw err;
  });
  await client.query("DELETE FROM preset WHERE name = $1);", [presetName.trim()], (err, res) => {
    if (err) throw err;
  });
}

async function addPreset(presetName, classNames, expirationDate, callback) {
  // Check that preset doesn't already exist
  if(client == null) {
    callback("Cannot reach database. Please try again later");
    return;
  }
  let result = await client.query("SELECT name FROM preset;");
  for (let row of result.rows) {
    if(row.name.toUpperCase().trim() == presetName.toUpperCase().trim()) {
      callback("Preset with that name already exists! Please try another preset name");
      return;
    }
  }
  client.query("INSERT INTO preset(name, expirationDate) VALUES ($1, $2) RETURNING presetID;",
    [presetName.trim(), expirationDate], (err, res) => {
    if (err) {
      throw err;
    }
    // Insert one record for each className, with the presetName column the same for each
    for (let className of classNames) {
      client.query("INSERT INTO presetRow(presetID, classname) VALUES ($1, $2);",
        [res.rows[0]['presetid'], className.trim()], (err2, res2) => {
        if (err2) throw err2;
      });
    }
    callback()
  });
}

async function updatePreset(presetName, classNames, callback) {
  // Run delete
  deletePreset(presetName);
  // Run add
  addPreset(presetName, classNames, callback)
}

module.exports = {
  saveCalendar,
  loadCalendar,
  searchCalendarsByName,
  clearClassData,
  clearClassDataBySubjectInTerm,
  clearClassDataBySubjectAndTerm,
  insertClassRow,
  getClassData,
  getSubjectWithPreviousTerm,
  findUnusedSubjects,
  getBuildings,
  getClassNames,
  getRoomsInBuildingFreeDuringTime,
  getPresets,
  addPreset,
  deleteExpiredPresets,
  deletePreset,
  updatePreset
}