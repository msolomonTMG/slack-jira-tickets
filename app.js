'use strict';

const
  express = require('express'),
  bodyParser = require('body-parser'),
  slack = require('./slack'),
  seoSlackChannel = process.env.SLACK_CHANNEL_SEO,
  request = require('request');

var app = express();
app.set('port', process.env.PORT || 5000);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.get('/', function(req, res) {
  res.sendStatus(200)
})
app.post('/', function(req, res) {
  console.log(req.body)

  // show tickte dialog
  if (req.body.command && req.body.command == '/ticket') {

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
