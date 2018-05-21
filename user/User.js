// User.js
var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({  
	  name: String,
	  password: String,
	  score: Number,
	  updatecounter: Number,
	  role: String
	},
	{
	    timestamps: true
	}
);

mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');