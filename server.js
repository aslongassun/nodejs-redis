// server.js
var app = require('./app');
var socketIO = require('socket.io');
var port = process.env.PORT || 3000;
var redis = require("redis");


var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

// Open socket for more realtime on leaderboard
var io = socketIO(server);

var client = redis.createClient();

io.on('connection', (socket) => {

    // update list user realtime
	function intervalFunc() {

		client.zrevrange('users',0,-1,function(err,result){
		    var myObject = {
		        items: '['+result+']'
		    }
		    socket.emit('receiveusers', myObject);
		})
	}

	setInterval(intervalFunc, 1000);

});


