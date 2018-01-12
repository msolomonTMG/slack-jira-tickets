const
  request = require('request'),
  APP_URL = process.env.APP_URL || 'http://localhost:5000/',
  JIRA_URL = process.env.JIRA_URL || 'https://nowthis.atlassian.net',
  OAuth = require('oauth').OAuth;

//TODO: use jira_url here
var consumer =
  new OAuth(`${JIRA_URL}/plugins/servlet/oauth/request-token`,
                  `${JIRA_URL}/plugins/servlet/oauth/access-token`,
                  'neptune-the-doodle',
                  process.env.RSA_PRIVATE_KEY,
                  "1.0",
                  `${APP_URL}auth/atlassian-oauth/callback`,
                  "RSA-SHA1",
				          null);

var helpers = {

  makeJiraRequest: function(user, url, method, payload) {
    return new Promise(function(resolve, reject) {
      console.log('user creds')
      console.log(user)
      consumer._performSecureRequest(user.jiraToken,
        user.jiraTokenSecret,
        method.toUpperCase(),
        url,
        null,
        payload,
        'application/json',
        function(error, data, resp) {
          console.log("---------ERROR---------")
          console.log(error)
          // console.log("---------DATA---------")
          // console.log(data)
          // console.log("---------RESP---------")
          // console.log(resp)
          return resolve(data)
        })
    });
  }

}

var functions = {
  getTicketInfo: function(user, url) {
    return new Promise(function(resolve, reject) {

      helpers.makeJiraRequest(user, url, 'get')
        .then(ticket => {
          console.log('TICKET')
          console.log(ticket)
          return resolve(JSON.parse(ticket))
        })
        .catch(err => {
          return reject(err)
        })

    });
  },
  getActiveSprint: function(user, boardId) {
    return new Promise(function(resolve, reject) {
      console.log('getting active sprint')
      let url = `${JIRA_URL}/rest/agile/1.0/board/${boardId}/sprint`

      helpers.makeJiraRequest(user, url, 'get')
        .then(result => {
          result = JSON.parse(result)
          sprints = result.values
          sprints.forEach((sprint, index) => {
            if (sprint.state == "active") {
              return resolve(sprint)
            } else if (sprint.length = index + 1) {
              return reject({ error: "no active sprints" })
            }
          })
        })
        .catch(err => {
          console.log('error getting active sprint')
          console.log(err)
          return reject(err)
        })
      });
  },
  addIssueToActiveSprint: function(user, issue, activeSprint) {
    return new Promise(function(resolve, reject) {
      console.log('adding to active sprint...')
      let url = `${JIRA_URL}/rest/agile/1.0/sprint/${activeSprint.id}/issue`
      let data = JSON.stringify({ "issues": [ issue.key ] })

      helpers.makeJiraRequest(user, url, 'post', data)
        .then(success => {
          console.log('success')
          return resolve(success)
        })
        .catch(err => {
          console.log('error adding to active sprint')
          console.log(err)
          return reject(err)
        })
      });
  },
  createTicket: function(user, payload) {
    return new Promise(function(resolve, reject) {
      //TODO: understand the slack payload
      let ticketData = JSON.stringify({
        fields: {
          project: {
            key: payload.project
          },
          summary: payload.summary,
          description: payload.description,
          issuetype: {
            name: "Task"
          }
        }
      })

      helpers.makeJiraRequest(user, `${JIRA_URL}/rest/api/2/issue/`, 'post', ticketData)
        .then(ticket => {
          console.log(JSON.parse(ticket))
          return resolve(JSON.parse(ticket))
        })
        .catch(err => {
          return reject(err)
        })

    })
  }
}

module.exports = functions;
