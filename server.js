// server.js
var app = require('./app');
var socketIO = require('socket.io');
var port = process.env.PORT || 3000;
var redis = require("redis");


var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

var io = socketIO(server);

var client = redis.createClient();

io.on('connection', (socket) => {

    // Listen emit get users event
    socket.on('getusers', function() {
        client.zrevrange('users',0,-1,function(err,result){
            var myObject = {
                items: '['+result+']'
            }
            socket.emit('receiveusers', myObject);
        })
    });

    // Listen emit get users event from admin
    socket.on('getusers-from-admin', function(data) {

        var minutes = parseInt(data);
        var date = new Date();
        var currentTimeStart = date.getTime() - minutes * 60 * 1000;
        var currentTimeEnd = date.getTime();

        if (minutes > 0){
            client.zrevrangebyscore('admin_users',currentTimeEnd,currentTimeStart,function(err,result){
                var myObject = {
                    items: '['+result+']'
                }
                socket.emit('receiveusers', myObject);
            })
        } else {
            client.zrevrange('admin_users',0,-1,function(err,result){
                var myObject = {
                    items: '['+result+']'
                }
                socket.emit('receiveusers', myObject);
            })
        }
    });
});
