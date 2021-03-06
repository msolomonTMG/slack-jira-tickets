var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
  slackUsername: String,
  jiraUsername: String,
  jiraToken: String,
  jiraTokenSecret: String,
  lastProjectSelected: String
});

var User = mongoose.model('Users', userSchema);

var helpers = {

}

var functions = {
  deleteMike: function() {
    return new Promise(function(resolve, reject) {
      User.remove({
        slackUsername: 'mike.solomon'
      },function(success) {
        return resolve(success)
      })
    });
  },
  create: function(userObj) {
    console.log('GOT USER OBJ', userObj)
    return new Promise(function (resolve, reject) {
      if (!userObj.slackUsername || !userObj.jiraToken || !userObj.jiraTokenSecret) {
        return reject({
          error: {
            msg: 'User must have slack username and jira credentials set'
          }
        })
      } else {
        newUser = new User ({
          slackUsername: userObj.slackUsername,
          jiraUsername: userObj.jiraUsername,
          jiraToken: userObj.jiraToken,
          jiraTokenSecret: userObj.jiraTokenSecret
        });
        console.log(newUser)
        newUser.save(function (err, user) {
          if (err) {
            console.log(err)
            return reject(err)
          } else {
            return resolve(user)
          }
        });
      }
    })
  },
  update: function(mongoId, updates) {
    console.log('I AM UPDATING USER ' + mongoId)
    return new Promise(function(resolve, reject) {
      User.update(
        { _id: mongoId },
        { $set: updates },
        function(err, result) {
          if (err) {
            return reject(err);
          } else {
            User.findOne({
              _id: mongoId
            }, function(err, user) {
              if(!err) {
                return resolve(user)
              } else {
                return reject(err)
              }
            })
          }
        }
      );
    })
  },
  getBySlackUsername: function(slackUsername) {
    return new Promise(function(resolve, reject) {
      User.findOne({
        slackUsername: slackUsername
      }, function(err, user) {
        if(!err) {
          return resolve(user)
        } else {
          return reject(err)
        }
      })
    });
  },
  getMike: function() {
    return new Promise(function(resolve, reject) {
      User.findOne({
        slackUsername: 'mike'
      }, function(err, users) {
        if(!err) {
          return resolve(users)
        } else {
          return reject(err)
        }
      })
    });
  }
}


module.exports = functions;
