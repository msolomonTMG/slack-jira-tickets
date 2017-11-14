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

console.log(consumer)
// var oa = new OAuth({
//   requestUrl: 'https://nowthis.atlassian.net/plugins/servlet/oauth/request-token',
//   accessUrl: 'https://nowthis.atlassian.net/plugins/servlet/oauth/access-token',
//   callback: `${APP_URL}auth/atlassian-oauth/callback`,
//   consumerKey: 'neptune-the-doodle',
//   consumerSecret: process.env.RSA_PRIVATE_KEY,
//   signatureMethod: 'RSA-SHA1'
// });


// var oauth = new OAuth.OAuth(
//   'https://nowthis.atlassian.net/plugins/servlet/oauth/request-token',
//   'https://nowthis.atlassian.net/plugins/servlet/oauth/access-token',
//   'neptune-the-doodle',
//   process.env.RSA_PRIVATE_KEY,
//   '1.0A',
//   null,
//   'RSA-SHA1'
// );

var helpers = {

}

var functions = {
  makeJiraRequest: function(user) {
    return new Promise(function(resolve, reject) {
      console.log('user creds')
      console.log(user)
      consumer.get("https://nowthis.atlassian.net/rest/api/2/issue/37440",
      						user.jiraToken,
      						user.jiraTokenSecret,
      						"application/json",
                  function(error, data, resp) {
                    console.log(data)
                    return data
                  })

      // oa.get({
      //   url: 'https://nowthis.atlassian.net/rest/api/2/issue/37440',
      //   oauth_token: user.jiraToken,
      //   oauth_token_secret: user.tokenSecret,
      // }, function(data) {
      //   console.log('GOT DATA')
      //   console.log(data)
      //   return resolve(data)
      // });

      // oauth.get('https://nowthis.atlassian.net/rest/api/2/issue/37440',
      // user.jiraToken, //test user token
      // user.jiraTokenSecret, //test user secret
      // function (err, data, res){
      //   if (err) {
      //     console.log('error with jira request')
      //     console.log(err);
      //     return reject(err);
      //   } else {
      //     console.log('jira data')
      //     console.log(data)
      //     return resolve(data)
      //   }
      // });


    });
  }
}

module.exports = functions;
