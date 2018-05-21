# NodeJS connect to Redis

Backend NodeJS service for leaderboard this version use Redis as a database management.

## Getting Started

### Prerequisites
You need to install these app on your system first:<br />
- [Node](https://nodejs.org/en/)<br />
- [Redis](https://redis.io/download)<br />

### Installing

1) Get project from Github<br />
```
$ git clone https://github.com/aslongassun/nodejs-redis.git
```
2) Go to project folder and run<br/>
```
npm init
npm install express
npm install body-parser
npm install redis
npm install url
```
3) Run the server<br/>
At the project folder run this commandline<br/>
```
node server.js
```
4) Now you can see the server is running<br/>
```
Express server listening on port 3000
```
5) Get client Unity application to connect to this server for testing<br/>
```
$ git clone https://github.com/aslongassun/leaderboard-unity-client.git
```
6) Open file RequestManager.cs int the Asset/Scripts folder, edit _Url and _Port to connect to your server url<br/>
```
// Connect to local host
private static string _Url = "http://localhost";
private static string _Port = ":" + "3000";

// Connect to clound
//private static string _Url = "https://[appname].herokuapp.com";
//private static string _Port = "";
```
7) Build and Run the application<br/>
For more information about set up User role and Admin role to test, please read README.md file of Client Unity application project
