const
  request = require('request'),
  OAuth   = require('oauth-1.0a'),
  crypto  = require('crypto');

var helpers = {

}

var functions = {
  makeJiraRequest: function(user) {
    return new Promise(function(resolve, reject) {

      let request_data = {
        url: 'nowthis.atlassian.net/rest/api/2/issue/37440',
        method: 'GET'
      };

      request({
        url: request_data.url,
        method: request_data.method,
        headers: oauth.toHeader(oauth.authorize(request_data, user.jiraToken))
      }, function(error, response, body) {
          if (error) {
            console.log('error')
            console.log(error)
            return reject(error)
          } else {
            console.log('body')
            console.log(body)
            return resolve(body)
          }
      });

    });
  }
}

module.exports = functions;
