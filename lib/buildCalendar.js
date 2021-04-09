const fs = require("fs");
const days = 5;
const time_slots = 27;

function buildCalendar(classList, classDataArr) {
    var calendarData = {}
    for(var classData of classDataArr) {
        var className = classData.Name
        calendarData[className] = []
        // Add time slots to class's array
        for(var meetingData of classData.Meeting) {
            calendarData[className] = calendarData[className].concat(getTimeSlots(meetingData))
        }
    }

    return calendarData
}

/**
 * Gets array of time slots given a meeting time
 * 
 * @param {dictionary} meetingData dictionary of [DAYS, HOURS (of the day)] (ex: {"days": "MWF", "hours": 1:00 PM - 3:00 PM"})
 * @returns {array} List of all time indices represented by the meeting time (ex: [1,2,3, 16,17,18, 33,34,35])
 */
function getTimeSlots(meetingData) {
    // Read all entries
    if(meetingData.hours != " - ") {
        // Times
        var times = meetingData.hours.split(/ - /);
        var timeEnds = []
        for(var k = 0; k < 2; k++) {
            var index = (Number(times[k].substring(0, 2)) - 8)*2;
            if (times[k].substring(7, 9) === "PM" && index < 8) index += 24;
            if (Number(times[k].substring(3, 5)) >= 30) index ++;
            timeEnds[k] = index;
        }
        // Return array of all numbers between beginning and end (inclusive)
        var timeIndices = Array.from(new Array((timeEnds[1] + 1) - timeEnds[0]), (x,i) => i + timeEnds[0]);

        // Days
        var timeDays = []
        for (var day = 0; day < meetingData.days.length; day++) {
            switch(meetingData.days[day]) {
                case 'M':
                    timeDays.push(0)
                    break;
                // TODO: Improve to know FOR SURE which day is used in cases like Operating Systems
                case 'T':
                    timeDays.push(1)
                    break;
                case 'W':
                    timeDays.push(2)
                    break;
                case 'H':
                    timeDays.push(3)
                    break;
                case 'F':
                    timeDays.push(4)
                    break;
                default:
            }                
        }

        var timeSlots = []
        for(var j = 0; j< timeDays.length; j++ ) {
            for (var k = 0; k < timeIndices.length; k++) {
                    timeSlots.push(timeIndices[k] + timeDays[j]*time_slots)
            }
        }
        return timeSlots
    }
    else {
        return []
    }
}

module.exports = buildCalendar;