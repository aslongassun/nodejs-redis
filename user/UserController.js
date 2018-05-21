// UserController.js
var express = require('express');
var redis = require("redis");
var url = require('url');
var bodyParser = require('body-parser');

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

//-----For heroku----//
// var redisURL = url.parse(process.env.REDISCLOUD_URL,true);
// var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
// client.auth(redisURL.auth.split(":")[1]);
// client.on("error", (err) =>
// {
//     console.log("Redis error: " + err);
// });

//-----For local------//
var client = redis.createClient();
client.on("error", function (err) {
    console.log("Error " + err);
});

// var bodyParser = require('body-parser');
// router.use(bodyParser.urlencoded({ extended: true }));
// router.use(bodyParser.json());
// var User = require('./User');

//return all the user in database
router.get('/', function (req, res) {

    client.zrevrange('users',0,-1,function(err,result){
        console.log('['+result+']');
        res.status(200).send('['+result+']');
    })

    // client.zrange('users',0,-1,'withscores',function(err,result){
    //     console.log(result);
    //    res.status(200).send(result);
    // })

    //res.status(200).send("call get");
    
    // client.set('framework', 'AngularJS', function(err, reply) {
    //   console.log(reply);
    // });
    // client.get('framework', function(err, reply) {
    //     console.log(reply);
    // });

    // client.hmset('frameworks', 'javascript', 'AngularJS', 'css', 'Bootstrap', 'node', 'Express');
    // client.hmset('user', {
    //     'name': 'user1',
    //     'passwork': '1111'
    // });

    // client.hgetall('user1', function(err, object) {
    //     console.log(object);
    //     res.status(200).send(object);
    // });

    // client.zadd(["user1",10,"1111"], (err) =>
    // {
    //     console.log("redis have proplem!");
    //     console.log(err);
    // });

    // User.find({role:"user"}, function (err, users) {
    //     if (err) return res.status(500).send("Problem when get all users.");
    //     res.status(200).send(users);
    //     console.log("Gets Called");
    // }).sort({score: 'desc'});

});

// create user
router.post('/', function (req, res) {
    
    // check userId is created
    // client.exists("user:_id", function(err, reply) {
    //     if (reply != 1) {
    //         console.log("not existed");
    //         client.set("user:_id", 1);
    //     }
    // });

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

        // var login_info = req.body.name + "_" + req.body.password;
        // client.set(user_id, login_info, function(err, reply) {
        //     // add data for leaderboard
        //     client.zadd("users", 0, userInfo);
        //     // inscrease user_id key
        //     client.incr("user:_id");
        //     // add data to set uiser-id info
        //     client.set(user_id, userInfo);
        //     // request success
        //     res.status(200).send(userInfo);
        //     console.log(userInfo);
        // });


    });

    

    // User.create({
    //         name : req.body.name,
    //         password : req.body.password,
    //         score : 0,
    //         updatecounter: 0,
    //         lastmodified: new Date(),
    //         role: 'user'
    //     }, 
    //     function (err, user) {
    //         if (err) return res.status(500).send("Problem when adding user to the database." + err);
    //         res.status(200).send(user);
    //         console.log("Create Called");
    //     });

    
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
    
    // User.find({name:req.body.name, password:req.body.password}, function (err, users) {
    //     if (err) return res.status(500).send("Problem when get all users.");
    //     if (users.length == 0) return res.status(404).send("Not found any user.");
    //     res.status(200).send(users);
    //     console.log("Login Called");
    // });

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
        var userInfo = JSON.parse(object);
        userInfo.name = req.body.name;
        userInfo.score = req.body.score;
        userInfo.updatecounter = parseInt(userInfo.updatecounter) + 1;
        userInfo.updatedAt = currentTime;
        userInfo.timemilisecond = currentTime.getTime();

        userInfo = JSON.stringify(userInfo);

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

    // User.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, user) {
    //     if (err) return res.status(500).send("Problem when updating the user.");
    //     res.status(200).send(user);
    //     console.log("Update Called");
    // });
});

//return all the user in database
router.get('/admin', function (req, res) {
    console.log('/admin');
    client.zrevrange('admin_users',0,-1,function(err,result){
        console.log('['+result+']');
        res.status(200).send('['+result+']');
    })

    // client.zrevrange('users',0,-1,function(err,result){
        
    //     console.log('before sort');
    //     console.log('['+result+']');

    //     //-----SORT BY TIME UPDATE DESC--------
    //     // var resultJSON = JSON.parse('['+result+']');
    //     // resultJSON = resultJSON.sort(function(a, b) {
    //     //     return parseFloat(b.timemilisecond) - parseFloat(a.timemilisecond);
    //     // });
    //     // result = JSON.stringify(resultJSON);
    //     //-------------------------------------

    //     console.log('after sort');
    //     console.log(result);

    //     res.status(200).send(result);
    // })


    // User.find({role:"user"}, function (err, users) {
    //     if (err) return res.status(500).send("Problem when get all users.");
    //     res.status(200).send(users);
    //     console.log("Gets Called");
    // }).sort({updatedAt: 'desc'});
});

// delete user
router.delete('/:id', function (req, res) {
    var user_id = req.params.id;
    console.log("user id:" + user_id);

    // remove item in sort set
    client.get(user_id, function(err, object) {

        // remove item in sort set
        client.zrem("users", object);
        // remove item in sort set admin
        console.log("afterremove");
        console.log(object);
        client.zrem("admin_users", object);
        // remove item in set data
        client.del(user_id);
        // remove user from login
        client.get(user_id+":login", function(err, object) {
            var login_info = object;
            console.log(login_info);
            client.del(login_info);
            client.del(user_id+":login");
        });

        res.status(200).send("User was deleted.");

    });



    // User.findByIdAndRemove(req.params.id, function (err, user) {
    //     if (err) return res.status(500).send("Problem when deleting the user.");
    //     res.status(200).send("User "+ user.name +" was deleted.");
    //     console.log("Delete Called");
    // });
});

router.get('/admin/:time', function (req, res) {

	console.log('/admin/:time');

    var minutes = parseInt(req.params.time);
    var date = new Date();

    var currentTimeStart = date.getTime() - minutes * 60 * 1000;
    var currentTimeEnd = date.getTime();

    console.log('minutes:' + minutes);
    console.log('start:' + currentTimeStart);
    console.log('end:' + currentTimeEnd);

    client.zrevrangebyscore('admin_users',currentTimeEnd,currentTimeStart,function(err,result){
        console.log('['+result+']');
        res.status(200).send('['+result+']');
    })


	// var date = new Date();
	// var minutes = parseInt(req.params.time);

	// date.setMinutes(date.getMinutes() - minutes);

 //    User.find({role:"user",updatedAt: {$gte: date}}, function (err, users) {
 //        if (err) return res.status(500).send("Problem when get all users.");
 //        res.status(200).send(users);
 //        console.log("Gets Called");
 //    }).sort({updatedAt: 'desc'});
    
});

// get user from id
// router.get('/:id', function (req, res) {
//     User.findById(req.params.id, function (err, user) {
//         if (err) return res.status(500).send("Problem when finding user by id.");
//         if (!user) return res.status(404).send("No user found.");
//         res.status(200).send(user);
//     });
// });

module.exports = router;