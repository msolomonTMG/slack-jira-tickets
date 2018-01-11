'use strict';

const
  express = require('express'),
  exphbs = require('express-handlebars'),
  bodyParser = require('body-parser'),
  slack = require('./slack'),
  jira = require('./jira'),
  passport = require('passport'),
  user = require('./user'),
  config = require('./config'),
  AtlassianOAuthStrategy = require('passport-atlassian-oauth').Strategy,
  request = require('request'),
  mongoose = require('mongoose'),
  APP_URL = process.env.APP_URL || `http://localhost:5000/`,
  JIRA_URL = process.env.JIRA_URL,
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

// passport setup for atlassian
// called from route: /auth/atlassian-oauth
passport.use(new AtlassianOAuthStrategy({
  applicationURL: `${JIRA_URL}`,
  callbackURL:`${APP_URL}auth/atlassian-oauth/callback`,
  passReqToCallback: true,
  consumerKey:"neptune-the-doodle",
  consumerSecret:process.env.RSA_PRIVATE_KEY
}, function(req, token, tokenSecret, profile, done) {
    console.log('HELLO')
    process.nextTick(function() {
      console.log(token)
      console.log(tokenSecret)
      console.log(req.session.slackUsername)

      user.create({
        slackUsername: req.session.slackUsername,
        jiraToken: token,
        jiraTokenSecret: tokenSecret
      }).then(createdUser => {
        return done(null, createdUser)
      })
    })
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/', function(req, res) {

  if (req.query.success) {
    res.render('message', {
      successMsg: 'You can now create tickets with /ticket in Slack!'
    })
  } else {
    res.render('home')
  }

})

app.get('/delete', function(req, res) {
  user.deleteMike().then(success => {
    user.getMike().then(user => {
      res.send(JSON.stringify({user: user.slackUsername}))
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
        // save slack username to session to use when saving user after auth
        req.session.slackUsername = req.query.slackUsername
        // send to auth route
        res.redirect('/auth/atlassian-oauth')

      } else {
        // this user already signed up
        res.send(JSON.stringify({user: thisUser}))
      }
    })
})

// auth route uses passport
app.get('/auth/atlassian-oauth',
    passport.authenticate('atlassian-oauth'),
    function (req, res) {
      console.log('ATLASSIAN AUTH')
      res.render('message', {
        successMsg: 'yay!'
      })
        // The request will be redirected to the Atlassian app for authentication, so this
        // function will not be called.
    })

app.get('/auth/atlassian-oauth/callback',
    passport.authenticate('atlassian-oauth', { failureRedirect:'/fail' }),
    function (req, res) {
      console.log("ATLASSIAN AUTH CALLBACK")
      console.log(req.session)
        res.redirect('/?success=true');
    })

app.get('/auth/atlassian-oauth/authorize', function(req, res) {
  console.log('AUTH URL')
  console.log(req.body)
  res.sendStatus(200)
})

app.post('/', function(req, res) {
  //console.log(req.body)

  // show tickte dialog
  if (req.body.command && req.body.command == '/ticket') {
    user.getBySlackUsername(req.body.user_name)
      .then(thisUser => {
        if (!thisUser) {
          // slack will post OK in the channel if you just return 200
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send()
          // the user must auth with Jira first
          slack.sendPrivateMessage(req.body.channel_id,
                                   req.body.user_id,
          `:hand: To create tickets from Slack, you must first *<${APP_URL}auth?slackUsername=${req.body.user_name}|auth with Jira>*`)
        } else {
          // slack will post OK in the channel if you just return 200
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send()
          // this user already authed, show dialog
          slack.openCreateTicketDialog(req.body)
        }
      })

    // create ticket
  } else if (req.body.payload) {

    let payload = JSON.parse(req.body.payload)

    if (payload.type == 'dialog_submission') {
      res.setHeader('Content-Type', 'application/json')
      //stupid slack needs an empty body
      res.status(200).send({})
      console.log(payload)
      user.getBySlackUsername(payload.user.name).then(thisUser => {

        jira.createTicket(thisUser, payload.submission)
          .then(result => {

            jira.getTicketInfo(thisUser, result.self)
              .then(issue => {

                let jiraURL = issue.self.split('/rest/api')[0];
                console.log("interruption is a " + payload.submission.interruption)
                // do extra jira things if this is an interruption
                if (payload.submission.interruption == "yes") {
                  console.log('here we are')
                  let projectConfig = config.find(project => project.value == payload.submission.project)
                  let boardId = projectConfig.boardId

                  jira.getActiveSprint(thisUser, boardId)
                    .then(activeSprint => {

                      jira.addIssueToActiveSprint(thisUser, issue, activeSprint)
                        .then(success => {

                          slack.sendMessage(payload.channel.id,
                            `:bangbang: ${issue.fields.creator.displayName} created an issue with the \`/ticket\` command and added the issue to the current sprint!`,
                            [{
                              fallback: `${issue.fields.creator.displayName} created <${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
                              title: `<${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
                              color: 'danger',
                              thumb_url: `${issue.fields.creator.avatarUrls["48x48"]}`,
                              fields: [{
                                title: "Description",
                                value: `${issue.fields.description}`,
                                short: false
                              }]
                            }]
                          )

                        })
                        .catch(err => {
                          console.log(err)
                        })
                    })
                    .catch(err => {
                      console.log(err)
                    })

                } else {

                  slack.sendMessage(payload.channel.id,
                    `:raised_hands: ${issue.fields.creator.displayName} created an issue with the \`/ticket\` command${addedToSprintText}!`,
                    [{
                      fallback: `${issue.fields.creator.displayName} created <${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
                      title: `<${jiraURL}/browse/${issue.key}|${issue.key}: ${issue.fields.summary}>`,
                      color: 'good',
                      thumb_url: `${issue.fields.creator.avatarUrls["48x48"]}`,
                      fields: [{
                        title: "Description",
                        value: `${issue.fields.description}`,
                        short: false
                      }]
                    }]
                  )

                }
              })
              .catch(err => {
                console.log(err)
              })
          }).catch(err => {
            console.log(err)
          })

      }).catch(err => {
        console.log('error getting user')
        console.log(err)
      })


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
