# * MOC MEETUP *
#### https://mocs-meetup.herokuapp.com

Moc Meetup is a project for UTC students (University of Tennessee at Chattanooga) that scrapes the UTC course catalog and helps students find statistically viable meeting times for their clubs. The project code is hosted on heroku with a Free Dyno and free Postgres Database.

### How does it work?

On the first day of each UTC semester, the project wipes the database and scrapes the newest class schedule. Users can then specify classes in the site's main page to see the times those classes appear in heatmap form

### Who is this useful for?

1. **Teams.** If you're a member of a study groups or group project, and you need to find a room for your group to meet up, Moc Meetup provides a way to plan on classrooms that aren't in use.
2. **Club organizers.** If you're the event organizer for a club, you know the difficulty in finding a consistent place and time for Freshman or Sophomores to find you. This tool is a way for your to know the most statistically likely times for those students to be available.
3. **Appointment-Based Tutors.** If you're a tutor setting up appointment times for students, you may need to know when those students CAN set up an appointment. Furthermore, if you tutor for several classes, you know many students may need to make appointments, but can't due to class conflicts. Moc Meetup helps you get a visible heatmap of how some classes stack are laid out on an hourly basis to find times that everyone can make use of.

### Heroku?

Heroku is a cloud hosting site. They have free trials for students, and most users are allowed one low-traffic dyno (a heroku term for servers) for learning use. Heroku has a lot of great tutorials and is a fantastic resource for makers.

### Postgres?

Postgres is a part of the SQL language family, and uses relational data. Tables are defined by what they can hold and the database sorts the data for maximumum space and speed efficiency. SQL is a tricky subject, but several UTC professors teach amazing courses on the subject and can help you understand it. As of 2021 (dated, I know), a great resource is Dr. David Schwab.

The postgres database and Heroku DYNO are using "hobbyist free verisons" of both, which have a low cap for memory and performance, but are perfect for projects like this one!

### Puppeteer

Yes, the backbone of this app, Puppeteer is a web-scraping package. We use it to read the class data from the UTC class schedule. This data is then inserted into the Postgres database and visualized for you to see the weekly layout!

### Tableau!

Tableau is a data visualization tool for business users. It also has a fantastic API for embedding these visualizations in websites. This is how Moc Meetup takes the data in Postgres and visualizes the UTC class data. Since this project uses [Tableau Public](https://public.tableau.com/s/), Moc Meetup first uploads the data to a google sheet. Tableau Public not only is compatible with google sheets, but updates itself daily if the sheet it reads changes. This is how Moc Meetup stays relevant even with changing semesters.