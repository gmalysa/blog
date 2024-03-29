/**
 * Handle loading configuration information from a local json file and suggest some default values
 */

var _ = require('underscore');
var local = require('./config.json');

var defaults = {
	// Express settings and options
	set : {'env' : 'development'},
	enable : ['trust proxy'],

	// Project directory and URL organization
	static_dir :'static',
	route_dir : 'routes',
	template_dir : 'templates',
	static_path : '/static',
	client_path : '/ui.js',
	client_prefix : 'c-',

	// Server config settings
	port : 8124,
	base_url : 'https://localhost',
	session_secret : 'thisisasecret',

	// MySQL settings
	mysql : {
		host : 'localhost',
		user : '',
		database : '',
		password : '',
	},

	// Google OAuth info
	google : {
		clientID : '',
		clientSecret : '',
	},

	// Identify admins by google id
	admin_g_id : 'invalid'
};

module.exports = _.extend({}, defaults, local);
