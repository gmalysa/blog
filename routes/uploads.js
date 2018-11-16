/**
 * Upload things, mostly just images, to the static folder
 */

var fl = require('flux-link');
var db = require('db-filters');
var fs = require('fs');

var config = require('../config.js');

/**
 * Show the form to select and upload data
 */
var upload_form = new fl.Chain(
	function(env, after) {
		env.$template('upload');
		after();
	}
);

/**
 * Handle uploading data
 */
var upload = new fl.Chain(
	function(env, after) {
		if (Object.keys(env.req.files).length == 0) {
			env.$throw(new Error('No file uploaded'));
			return;
		}

		env.req.files.upload.mv(__dirname + '/../' + config.static_dir + '/images/'
			+ env.req.body.filename, env.$check(after));
	},
	function(env, after) {
		env.$redirect('/uploads');
		after();
	}
);

/**
 * Show all uploads
 */
var show_uploads = new fl.Chain(
	function(env, after) {
		fs.readdir(__dirname + '/../' + config.static_dir + '/images', env.$check(after));
	},
	function(env, after, files) {
		env.$template('uploads');
		files.sort();
		env.$output({
			files : files
		});
		after();
	}
);

module.exports.init_routes = function(server) {
	server.add_route('/upload', {
		fn : upload_form,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'get');

	server.add_route('/upload', {
		fn : upload,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'post');

	server.add_route('/uploads', {
		fn : show_uploads,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'get');
};
