const
  request = require('request'),
  APP_URL = process.env.APP_URL || 'http://localhost:5000/',
  OAuth = require('oauth').OAuth;

var consumer =
  new OAuth("https://nowthis.atlassian.net/plugins/servlet/oauth/request-token",
                  "https://nowthis.atlassian.net/plugins/servlet/oauth/access-token",
                  'neptune-the-doodle',
                  process.env.RSA_PRIVATE_KEY,
                  "1.0",
                  `${APP_URL}auth/atlassian-oauth/callback`,
                  "RSA-SHA1",
				          null);

var helpers = {

}

var functions = {
  makeJiraRequest: function(user) {
    return new Promise(function(resolve, reject) {
      console.log('user creds')
      console.log(user)
      consumer._performSecureRequest(user.jiraToken,
        user.jiraTokenSecret,
        'GET',
        'https://nowthis.atlassian.net/rest/api/2/issue/37440',
        null,
        null,
        'application/json',
        function(error, data, resp) {
          console.log(error)
          console.log(data)
          console.log(resp)
          return resolve(data)
        })
    });
  }
}

module.exports = functions;
