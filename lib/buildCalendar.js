const fs = require("fs");
const days = 5;
const time_slots = 27;

function buildCalendar(classData) {
    var calendarData = []
    for(var className in classData) {
        // Add time slots to class's array
        for(var meetingData of classData[className]) {
            calendarData = calendarData.concat(getTimeSlots(meetingData, className))
        }
    }

    return formatData(calendarData)
}

// Formats data as a highcharts-friendly array of {x: , y: , value: , classList: }
function formatData(data) {
    var showAllClasses = (data.length <= 675);

    var chartArray = []
    for (var x = 0; x < days; x++) {
        for (var y = 0; y < time_slots; y++) {
            var classNames = [...new Set(data.filter(v => v.x == x && v.y == y).map(v => v.name))]
            chartArray.push({
                x: x,
                y: y,
                value: classNames.length,
                classList: showAllClasses ? classNames.join(',') : '...'
            })
        }
    }
    return chartArray;
}

/**
 * Gets array of time slots given a meeting time
 * 
 * @param {dictionary} meetingData dictionary of [DAYS, HOURS (of the day)] (ex: {"days": "MWF", "hours": 1:00 PM - 3:00 PM"})
 * @returns {array} List of all time indices represented by the meeting time (ex: [1,2,3, 16,17,18, 33,34,35])
 */
function getTimeSlots(meetingData, className) {
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
                timeSlots.push({x: timeDays[j], y: timeIndices[k], name: className})
            }
        }
        return timeSlots
    }
    else {
        return []
    }
}

module.exports = buildCalendar;