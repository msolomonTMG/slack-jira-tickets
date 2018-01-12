const
  request = require('request'),
  config = require('../config'),
  slackOauthToken = process.env.SLACK_OAUTH_TOKEN,
  slackBotToken = process.env.SLACK_BOT_TOKEN;

var helpers = {

}

var functions = {
  sendPrivateMessage: function(channel, userId, text, attachments) {
    return new Promise(function(resolve, reject) {

      let postData = {
        text: text,
        user: userId,
        channel: channel
      }

      if (attachments) {
        postData.attachments = attachments
      }

      let options = {
        method: 'post',
        body: postData,
        json: true,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${slackOauthToken}`
        },
        url: 'https://slack.com/api/chat.postEphemeral'
      }

      request(options, function(err, res, body) {
        if (err) {
          console.error('error posting json: ', err)
          return reject(err)
        } else {
          console.log(body)
          console.log('messaged Slack')
          return resolve(true)
        }
      })

    })
  },
  /*
   * Send messages to slack channels
   * @param {array} urls - URLs (webhooks) to send slack messages to
   * @param {string} text - The text of the slack message
   * @param {array} attachments - Array of objects for slack attachments
  */
  sendMessage: function(channel, text, attachments) {
    return new Promise(function(resolve, reject) {

      let postData = {
        text: text,
        channel: channel
      }

      if (attachments) {
        postData.attachments = attachments
      }

      console.log(postData)

      let options = {
        method: 'post',
        body: postData,
        json: true,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${slackOauthToken}`
        },
        url: 'https://slack.com/api/chat.postMessage'
      }

      request(options, function(err, res, body) {
        if (err) {
          console.error('error posting json: ', err)
          return reject(err)
        } else {
          console.log(body)
          console.log('messaged Slack')
          return resolve(true)
        }
      })

    })
  },
  openCreateTicketDialog: function(payload) {
    return new Promise(function(resolve, reject) {

      let projects = config.projects()
      let projectOptions = projects.map(option => {
        let formattedOption = {}
        formattedOption['label'] = option.name
        formattedOption['value'] = option.key
        return formattedOption
      })

      let dialog = {
        callback_id: "create-ticket",
        title: "Create a Jira Ticket",
        submit_label: "Create",
        elements: [
          {
            label: "Project",
            name: "project",
            type: "select",
            placeholder: "Select a project...",
            options: projectOptions
          },
          {
            label: "Summary",
            name: "summary",
            type: "text",
            value: payload.text
          },
          {
            label: "Description",
            name: "description",
            type: "textarea",
            optional: "true"
          }//,
          // {
          //   label: "Interruption?",
          //   name: "interruption",
          //   type: "select",
          //   placeholder: "Selecting yes will add the issue to the current sprint...",
          //   options: [
          //     {
          //       label: "No",
          //       value: "no"
          //     },
          //     {
          //       label: "Yes",
          //       value: "yes"
          //     }
          //   ],
          //   optional: "true",
          //   value: "no"
          // }
        ]
      }

      let urlEncodedDialog = encodeURIComponent(JSON.stringify(dialog))

      let options = {
        method: 'post',
        json: true,
        url: `https://slack.com/api/dialog.open?token=${slackOauthToken}&trigger_id=${payload.trigger_id}&dialog=${urlEncodedDialog}`
      }

      request(options, function(err, res, body) {
        if (err) {
          console.error('error posting json: ', err)
          return reject(err)
        } else {
          console.log('popped create ticket dialog')
          return resolve(true)
        }
      })

    })
  }
}

module.exports = functions;
