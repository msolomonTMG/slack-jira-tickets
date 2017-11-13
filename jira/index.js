const
  request = require('request'),
  OAuth   = require('oauth');


var oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  'neptune-the-doodle',
  process.env.RSA_PRIVATE_KEY,
  '1.0A',
  null,
  'RSA-SHA1'
);

var helpers = {

}

var functions = {
  makeJiraRequest: function(user) {
    return new Promise(function(resolve, reject) {

      oauth.get('nowthis.atlassian.net/rest/api/2/issue/37440',
      user.jiraToken, //test user token
      user.jiraTokenSecret, //test user secret
      function (err, data, res){
        if (err) {
          console.log(err);
        } else {
          console.log(data)
        }
        done();
      });


    });
  }
}

module.exports = functions;
