var express = require('express');
var router = express.Router();

const dataTier = require("../lib/dataTier");

/**
 * Email system for sending email authentication emails
 */
 const nodemailer = require('nodemailer');

 let transporter = null
 if(process.env.NODEMAILER_EMAIL){
     transporter = nodemailer.createTransport({
     service: "gmail",
     auth: {
         type: 'OAuth2',
         user: process.env.NODEMAILER_EMAIL,
         clientId: process.env.CLIENT_ID,
         clientSecret: process.env.CLIENT_SECRET,
         refreshToken: process.env.REFRESH_TOKEN,
         accessToken: process.env.ACCESS_TOKEN,
         expires: Number.parseInt(process.env.TOKEN_EXPIRE, 10),
     },
     });
 }

/* GET home page. */
router.get('/', function(req, res, next) {
  dataTier.getClassNames(function(classesArray) {
    dataTier.getPresets(function(presetsDict) {
      res.render('configSearch', { classes: classesArray, presets: presetsDict });
    })
  })
});

/* GET home page. */
router.get('/feedback', function(req, res, next) {
  res.render('feedback', { error: req.flash('error'),
                           message: req.flash('message')});
});

/* POST home page. */
router.post('/feedback', function(req, res, next) {
  // then send email to admin
  if(process.env.NODEMAILER_EMAIL){
    let message = {
        from: process.env.NODEMAILER_EMAIL,
        to: process.env.NODEMAILER_ADMIN,
        subject: "Moc-Meetup: Feedback",
        html: `
                <p>
                    Admin,
                    <br><br>
                    New feedback has been submitted by ${req.body.email}
                    <br><br>
                    <b>${req.body.feedback}</b>
                </p>
            `
    };
    // Attempt to send email to admin
    if (transporter != null) {
        transporter
            .sendMail(message)
            .catch((error) => {
                req.flash('error', 'Failed to send email. ' + error)
            });
    } else {
      req.flash('error', 'Cannot reach email server. Please try again later.')
    }
  }
  req.flash('message', 'Your feedback has been sent. Thank you!')

  res.redirect('/feedback');
});

module.exports = router;
