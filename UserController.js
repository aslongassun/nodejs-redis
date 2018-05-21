// UserController.js
var express = require('express');
var redis = require("redis");
var url = require('url');
var bodyParser = require('body-parser');

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

//-----CONFIG FOR CLOUND HEROKU-----//
// var redisURL = url.parse(process.env.REDISCLOUD_URL,true);
// var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
// client.auth(redisURL.auth.split(":")[1]);
//--------------------//
//-----CONFIG FOR LOCAL------//
var client = redis.createClient();
//--------------------//

client.on("error", function (err) {
    console.log("Error " + err);
});

// Open socket to list event update list users
var _PortSocketIO = 4567;
var io = require('socket.io')({
    transports: ['websocket'],
});
io.attach(_PortSocketIO);
io.on('connection', function(socket){
    
    // Listen emit get users event
    socket.on('getusers', function(data) {
        client.zrevrange('users',0,-1,function(err,result){
            var myObject = {
                items: '['+result+']'
            }
            socket.emit('receiveusers', myObject);
        })
        
    });

})

// return all the user in database
router.get('/', function (req, res) {
    client.zrevrange('users',0,-1,function(err,result){
        res.status(200).send('['+result+']');
    })
});

// create user
router.post('/', function (req, res) {

    client.get("user:_id", function(err, object) {

        var user_id = object;

        if(!object) {
             client.set("user:_id", 1);
             user_id = 1;
        }

        console.log("user_id:" + user_id);
        var currentTime = new Date();

        var userInfo = JSON.stringify({
            '_id': user_id,
            'name': req.body.name,
            'passwork': req.body.password,
            'score': 0,
            'updatecounter': 0,
            'role':'user',
            'updatedAt': currentTime,
            'timemilisecond': currentTime.getTime()
        });
        
        // login info set
        var login_info = req.body.name + "_" + req.body.password;
        client.set(login_info, user_id, function(err, reply) {
            // add data for leaderboard
            client.zadd("users", 0, userInfo);
            // add data for admnin leaderboard for order by update time
            client.zadd("admin_users", currentTime.getTime(), userInfo);
            // inscrease user_id key
            client.incr("user:_id");
            // add data to set uiser-id info
            client.set(user_id, userInfo);
            // add set userid logininfo
            client.set(user_id+":login", login_info);
            // request success
            res.status(200).send(userInfo);
            console.log(userInfo);
        });

    });
    
});


// return all the user in database
router.post('/login', function (req, res) {

    var login_info = req.body.name + "_" + req.body.password;

    client.exists(login_info, function(err, reply) {
        if (reply === 1) {
            // get user id from login info
            client.get(login_info, function(err, object) {
                var user_id = object;
                console.log("user id:"+user_id);
                // get user info from user id
                client.get(user_id, function(err, object) {
                    console.log(object);
                    res.status(200).send('['+object+']');
                });
            });
        } else {
            return res.status(500).send("Problem when login" + err);
        }
    });

});

// update user
router.put('/:id', function (req, res) {
    var user_id = req.params.id;
    console.log("user id:" + user_id);

    client.get(user_id, function(err, object) {

        // remove item in sort set
        client.zrem("users", object);
        // remove item in sort set admin
        client.zrem("admin_users", object);

        // update set data
        var currentTime = new Date();

        console.log("objectbefore");
        console.log(object);

        var userInfo = JSON.parse(object);

        console.log("userInfo1");
        console.log(userInfo);

        userInfo.name = req.body.name;
        userInfo.score = req.body.score;
        userInfo.updatecounter = parseInt(userInfo.updatecounter) + 1;
        userInfo.updatedAt = currentTime;
        userInfo.timemilisecond = currentTime.getTime();

        userInfo = JSON.stringify(userInfo);

        console.log("userInfo2");
        console.log(userInfo);

        client.set(user_id, userInfo);
        // insert item in sort set
        client.zadd("users", parseInt(req.body.score), userInfo);
        // insert item in sort set admin
        client.zadd("admin_users", parseInt(req.body.score), userInfo);

        // change login info
        client.get(user_id+":login", function(err, object) {
            var old_login_info = object;
            var new_login_info = req.body.name + "_" + old_login_info.split("_")[1];
            client.del(old_login_info);
            client.set(new_login_info,user_id);
            client.set(user_id+":login",new_login_info);
        });
        
        res.status(200).send("["+userInfo+"]");

    });

});

//return all the user in database
router.get('/admin', function (req, res) {
    console.log('/admin');
    client.zrevrange('admin_users',0,-1,function(err,result){
        console.log('['+result+']');
        res.status(200).send('['+result+']');
    })

});

// delete user
router.delete('/:id', function (req, res) {
    var user_id = req.params.id;

    // remove item in sort set
    client.get(user_id, function(err, object) {
        // remove item in sort set
        client.zrem("users", object);
        // remove item in sort set admin
        client.zrem("admin_users", object);
        // remove item in set data
        client.del(user_id);
        // remove user from login
        client.get(user_id+":login", function(err, object) {
            var login_info = object;
            client.del(login_info);
            client.del(user_id+":login");
        });
        res.status(200).send("User was deleted.");

    });

});

// get users by time update
router.get('/admin/:time', function (req, res) {

    var minutes = parseInt(req.params.time);
    var date = new Date();
    var currentTimeStart = date.getTime() - minutes * 60 * 1000;
    var currentTimeEnd = date.getTime();
    client.zrevrangebyscore('admin_users',currentTimeEnd,currentTimeStart,function(err,result){
        res.status(200).send('['+result+']');
    })
    
});


module.exports = router;