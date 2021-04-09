const puppeteer = require("puppeteer");
const $ = require("jquery");
const dataTier = require("../lib/dataTier");

// TODO: Also put class start and end dates in data

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeUnusedClasses(term) {
    // Double-check for subjects that don't have any classes
    var unusedSubjects = await dataTier.findUnusedSubjects(term)
    console.log(unusedSubjects)
    for(let newSubject of unusedSubjects) {
        // Scrape data by subject and term
        await scrapeData(newSubject, term)
    }
}

async function scrapeData(major, term) {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(
    "https://sis-reg.utc.edu/StudentRegistrationSsb/ssb/classSearch/classSearch",
    { waitUntil: "networkidle0" }
  );

  page.click("#classSearchLink");
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  page.evaluate((term) => {
    return document
      .getElementById("txt_term")
      .setAttribute("listofsearchterms", term);
  }, term);
  page.click("#term-go");
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  await page.evaluate((major) => {
    // let elements = document.getElementById("txt_term")
    return document.getElementById("txt_subject").setAttribute("value", major); // CPSC,SUBJ,ANTH,etc to get multiple subjects
  }, major);
  page.focus("#txt_keywordlike");
  page.keyboard.type(``);
  await timeout(500);
  page.keyboard.down("Enter");
  await timeout(5000);

  // Shows 50 classes at a time
  if (await page.$(".page-size-select") !== null) {
    await page.select(".page-size-select", "50");
    await timeout(6000);

    // await page.screenshot({ path: `third.jpg`, fullPage: true });
    var res = true
    while(res) {
      var datas = await page.evaluate((term) => {
          var classes = $('#table1 tbody tr')
          var titleLinkArray = [];
          var m = 0;
          for (var classNum = 0; classNum < classes.length; classNum++) {
            var meetingTimes = [];
    
            $(classes.eq(classNum).children().eq(8)).find(".meeting").each(function() {
              var meetInfo = {}
              meetInfo['days'] =
                $(this)
                  .find("li")
                  .filter(function(index) {
                    return this.getAttribute("aria-checked") == "true";
                  })
                  .toArray()
                  .map(function(item, index) {
                    switch(item.getAttribute("data-name")) {
                      case "Monday":
                        return 'M';
                      case "Tuesday":
                        return 'T';
                      case "Wednesday":
                        return 'W';
                      case "Thursday":
                        return 'H';
                      case "Friday":
                        return 'F';
                      default:
                        return '';
                    }
                  })
                  .join('')
              
              meetInfo['hours'] =
                $(this)
                  .children("span").eq(0)
                  .text()
              
              meetInfo['building'] =
                $(this)
                  .children("span").eq(2)
                  .text()
                  .replace(/\s*Building:\s*/g, "")
              
              meetInfo['room'] =
                $(this)
                  .children("span").eq(3)
                  .text()
                  .replace(/\s*Room:\s*/g, "")
              meetingTimes.push(meetInfo)
            });
    
            titleLinkArray[m] = {
              Title: classes.eq(classNum).children().eq(0).find('a').text(),
              Subject: classes.eq(classNum).children().eq(1).text(),
              Level: classes.eq(classNum).children().eq(2).text(),
              Hours: classes.eq(classNum).children().eq(4).text(),
              CRN: classes.eq(classNum).children().eq(5).text(),
              Meeting: meetingTimes,
              Term: term,
              // Meeting place & Meeting room is good information but not needed
              Campus: classes.eq(classNum).children().eq(9).text()
            };
            m++;
          }
          return titleLinkArray;
        }, term);
      
      // Insert into database
      for (let x = 0; x < datas.length; x++) {
        dataTier.insertClassRow(datas[x]);
      }
  
      // Button with title "next" continues. If hasAttribute "disabled" then stop
      res = await page.evaluate(() => {
        if($('button[title="Next"]').attr("disabled") != undefined) {
          return false
        }
        return true;
      });

      if (res) {
        await page.click('button[title="Next"]');
        await timeout(5000);
      }
    }
  }
  await page.close();
  await browser.close();
  console.log("Browser Closed");
};

module.exports = {
  scrapeData,
  scrapeUnusedClasses
}