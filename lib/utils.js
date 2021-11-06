
function getTerm() {
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getDate();
    var term = "202020"
    if (month >= 10) // Start scraping Spring months in November until end of December
        term = (year+1).toString() + "20"
    else if (month <= 2) // Scraping Summer schedule until end of March
        term = year.toString() + "30"
    else // Scraping Fall schedule March until November
        term = year.toString() + "40"
    
    return term
}

module.exports = {
    getTerm
  }