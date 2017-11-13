'use strict';

const
  express = require('express'),
  exphbs = require('express-handlebars'),
  bodyParser = require('body-parser'),
  slack = require('./slack'),
  passport = require('passport'),
  user = require('./user'),
  seoSlackChannel = process.env.SLACK_CHANNEL_SEO,
  AtlassianOAuthStrategy = require('passport-atlassian-oauth').Strategy,
  request = require('request'),
  mongoose = require('mongoose'),
  APP_URL = process.env.APP_URL || `http://localhost:5000/`,
  MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mongo_test";

mongoose.connect(MONGO_URI, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + MONGO_URI + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + MONGO_URI);
  }
});

var app = express();
app.set('port', process.env.PORT || 5000);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// use atlassian oauth
passport.use(new AtlassianOAuthStrategy({
  applicationURL:"https://nowthis.atlassian.net",
  callbackURL:`${APP_URL}auth/atlassian-oauth/callback`,
  passReqToCallback: true,
  consumerKey:"neptune-the-doodle",
  consumerSecret:process.env.RSA_PRIVATE_KEY
}, function(req, token, tokenSecret, profile, done) {
    process.nextTick(function() {
      console.log(token)
      console.log(tokenSecret)
      console.log(req.session.slackUsername)

      user.create({
        slackUsername: req.session.slackUsername,
        jiraToken: token,
        jiraTokenSecret: tokenSecret
      })
      .then(createdUser => {
        res.render('message', {
          successMsg: 'You can now create tickets with <pre>/ticket</pre> in Slack!'
        })
      })
      .catch(err => {
        return done(JSON.stringify({error: err}))
      })

    })
  }
));

app.get('/', function(req, res) {
  res.sendStatus(200)
})

app.get('/delete', function(req, res) {
  user.deleteAll().then(success => {
    user.getAll().then(users => {
      res.send(JSON.stringify({users: users}))
    })
  })
})

app.get('/fail', function(req, res) {
  res.send(JSON.stringify({ success: false }))
})

app.get('/auth', function(req, res) {
  console.log('AUTH')
  user.getBySlackUsername(req.query.slackUsername)
    .then(thisUser => {
      if (!thisUser) {
        req.session.slackUsername = req.query.slackUsername
        res.redirect('/auth/atlassian-oauth')
      } else {
        // this user already signed up
        res.send(JSON.stringify({user: thisUser}))
      }
    })
})

app.get('/auth/atlassian-oauth',
    passport.authenticate('atlassian-oauth'),
    function (req, res) {
      console.log('ATLASSIAN AUTH')
        // The request will be redirected to the Atlassian app for authentication, so this
        // function will not be called.
    })

app.get('/auth/atlassian-oauth/callback',
    passport.authenticate('atlassian-oauth', { failureRedirect:'/fail' }),
    function (req, res) {
      console.log("ATLASSIAN AUTH CALLBACK")
      console.log(req.session)
        res.redirect('/');
    })

app.get('/auth/atlassian-oauth/authorize', function(req, res) {
  console.log('AUTH URL')
  console.log(req.body)
  res.sendStatus(200)
})

app.post('/', function(req, res) {
  console.log(req.body)

  // show tickte dialog
  if (req.body.command && req.body.command == '/ticket') {
    user.getBySlackUsername(req.body.user_name)
      .then(thisUser => {
        if (!thisUser) {
          // send a 200 for the slash command
          // res.setHeader('Content-Type', 'application/json');
          // res.setStatus(200)
          // res.send(JSON.stringify({ success: true }))
          // the user must auth with Jira first
          slack.sendPrivateMessage(req.body.channel_id,
                                   req.body.user_id,
          `:hand: To create tickets from Slack, you must first *<${APP_URL}auth?slackUsername=${req.body.user_name}|auth with Jira>*`)
        } else {
          // this user already authed, show dialog
          slack.openCreateTicketDialog(req.body)
            .then(success => {
              // slack will post OK in the channel if you just return 200
              res.setHeader('Content-Type', 'application/json');
              res.setStatus(200)
              res.send(JSON.stringify({ success: true }))
            })
            .catch(err => {
              res.sendStatus(500)
            })
        }
      })

    // create ticket
  } else if (req.body.payload) {

    let payload = JSON.parse(req.body.payload)
    console.log(payload)

    if (payload.type == 'dialog_submission') {
      res.setHeader('Content-Type', 'application/json')
      //stupid slack needs an empty body
      res.status(200).send({})
      slack.sendMessage(payload.channel.id, ':raised_hands: ticket created!')

    } else {
      res.sendStatus(500)
    }

  } else {

    res.sendStatus(500)

  }

})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
module.exports = app;
