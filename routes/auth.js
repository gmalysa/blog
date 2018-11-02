/**
 * Handle authentication using google's openid connect
 */

var fl = require('flux-link');
var passport = require('passport');
var google = require('passport-google-oauth').OAuth2Strategy;

var logger = require('../logger.js');
var config = require('../config.js');

// Setup serialization and deserialization functions
passport.serializeUser(function(user, done) {
	done(null, JSON.stringify(user));
});

passport.deserializeUser(function(serial, done) {
	done(null, JSON.parse(serial));
});

// Configure google strategy
passport.use(new google({
	clientID : config.google.clientID,
	clientSecret : config.google.clientSecret,
	callbackURL : config.base_url + '/auth/google/return'
}, function(accessToken, refreshToken, profile, done) {
	logger.info('Login for '+profile.displayName+' ('+profile.id+')', 'Login');
	return done(null, {
		id : profile.id,
		displayName : profile.displayName,
	});
}));

var addUser = new fl.Chain(
	function(env, after) {
		if (env.req.user) {
			env.user = env.req.user;
			env.isAdmin = env.user.id == config.admin_g_id;
			env.$output({
				user : env.user,
				isAdmin : env.isAdmin
			});
		}
		after();
	}
);

module.exports.init_routes = function(common) {
	common.server.get(
		'/auth/google',
		passport.authenticate('google', {
			scope : ['openid profile']
		})
	);

	common.server.get(
		'/auth/google/return',
		passport.authenticate('google', { failureRedirect : '/' }),
		function(req, res) { res.redirect('/'); }
	);

	common.server.get(
		'/auth/logout',
		function(req, res) {
			req.logout();
			res.redirect('/');
		}
	);

	common.add_pre_hook(addUser, 'default');
}
