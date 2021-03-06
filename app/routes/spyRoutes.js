const http = require('http');
const Promise = require("promise");

module.exports = function(app) {

  var data = {};
  var users = {};
  var token;

  var login = function() {
    var loginData = {"login_id": "j.prabhu91@gmail.com", "password": "!abcd1234"};

    const loginReqOptions = {
      hostname: 'ec2-13-126-112-247.ap-south-1.compute.amazonaws.com',
      port: 8065,
      path: '/api/v4/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    var loginReq = http.request(loginReqOptions, function(res) {
      token = res.headers.token;
      res.setEncoding('utf8');
      res.on('data', function(body) {
        console.log('Login successful');
      });
    });

    loginReq.write(JSON.stringify(loginData));
    loginReq.end();
  };


  login();
  
  app.get('/users', (req, res) => {
    console.log('get users');
    res.send(users);
  });

  app.get('/spies', (req, res) => {
  	console.log('get spies');
  	res.send(data);
  });

  app.post('/spies', (req, res) => {
  	console.log('post spies');
  	var requestBody  = req.body;
    console.log(requestBody);
  	var spyRequest = requestBody.text.trim();
  	var spyRequestTerms = spyRequest.split(' ');
  	if(spyRequestTerms[0] === '#spy') {
  		var victim = spyRequestTerms[1].startsWith('@') ? spyRequestTerms[1].substring(1) : spyRequestTerms[1];	
		  var user = {id: requestBody.user_id, name: requestBody.user_name}
      if(!users[victim]) {
        console.log(`User ${victim} not found in cache`);
        getUserId(victim)
          .then(addSpy.bind(null, victim, user));
      } else {
        addSpy(victim, user);
      }

      var responseMsg = 'Spy added for ' + victim;
		  res.send({username: 'spy-bot', text: responseMsg});
  	} else {
  		console.log(spyRequestTerms);
  		res.send({username: 'spy-bot', text: 'Failed to spy! Chech msg format.'});
  	}
    
  });

  
  var getUserId = function(victimName) {
    var prom = new Promise(function(resolve, reject){
      var options = {
        hostname: 'ec2-13-126-112-247.ap-south-1.compute.amazonaws.com',
        port: 8065,
        path: '/api/v4/users/usernames',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      };
      var usernameReq = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(body) {
          console.log(`Cache user details of ${victimName}`);
          var usersData = JSON.parse(body);
          if(usersData.length === 1) {
            var victimId = usersData[0].id;
            users[victimName] = victimId;  
          }
          resolve(users);
        });
      });  
      usernameReq.write(JSON.stringify([victimName]));
      usernameReq.end();  
    });

    return prom;
    
  };

  var addSpy = function(victimName, user) {
    console.log(`Add spy on ${victimName} for ${user.name}`);
    if(!data[victimName]) {
      data[victimName] = { id: users[victimName], users:[]};
    }
    data[victimName].users.push(user);
  }
};