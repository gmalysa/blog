/**
 * Generate equation displays using locally operated LaTeX installation
 */

var fl = require('flux-link');
var fs = require('fs');
var crypto = require('crypto');
var exec = require('child_process').exec;
var _ = require('underscore');
var showdown = require('showdown');

var use_png = true;

/**
 * Default options are the latex configuration to use, can be adjusted elsewhere
 */
var default_options = {
	tex			: '/usr/bin/latex',
	dvipng		: '/usr/bin/dvipng',
	dvisvgm		: '/usr/bin/dvisvgm',
	fg			: 'White',
	bg			: 'Transparent',
	bounding	: 'tight',
	resolution	: 100,
	path		: 'static/images/latex'
};

/**
 * Store a list of all latex images that have been generated and their matching source
 * The hashes are essentially linearly chained although they are assigned to individual
 * buckets for ease of use (see the logic in getLatex for clarification)
 */
var latex_cache = {};

/**
 * Take a given string and turn it into a full document for rendering
 * @param[in] math A math-mode only string to turn into a latex document
 * @return A full latex document to render
 */
function wrapLatex(math) {
	return '\\documentclass[12pt]{article}\n' +
			'\\usepackage{amsmath}\n' +
			'\\pagestyle{empty}\n\n' +
			'\\begin{document}\n\n' +
			'\\begin{gather*}\n' + math + '\n\\end{gather*}\n\n' +
			'\\end{document}';
}

/**
 * Take the given latex math-mode string and ensure that the matching file exists
 */
var generateLatex = new fl.Branch(
	function(env, after) {
		after(!latex_cache[env.id].started);
	},
	new fl.Chain(
		function(env, after) {
			latex_cache[env.id].started = true;
			fs.writeFile(env.options.path+'/'+env.file+'.tex',
			             wrapLatex(env.latex),
						 env.$check(after));
		},
		function(env, after) {
			exec(env.options.tex+' '+env.file+'.tex',
				 {cwd : env.options.path, encoding : 'utf8', env : process.env},
				 env.$check(after));
		},
		function(env, after) {
			if (use_png) {
				exec(env.options.dvipng
					+' -o '+env.file+'.png'
					+' -fg "'+env.options.fg+'"'
					+' -bg "'+env.options.bg+'"'
					+' -T '+env.options.bounding
					+' -D '+env.options.resolution
					+' '+env.file+'.dvi',
					 {cwd : env.options.path, encoding : 'utf8', env : process.env},
					 env.$check(after));
			}
			else {
				// use svg
				exec(env.options.dvisvgm
					+' -b min'
					+' -o '+env.file+'.svg'
					+' '+env.file+'.dvi',
					 {cwd : env.options.path, encoding : 'utf8', env : process.env},
					 env.$check(after));
			}
		},
		function(env, after) {
			after();
		}
	),
	function(env, after) {
		after();
	}
);

/**
 * This function synchronously computes the name of the matching latex image and begins
 * an un-tracked asynchronous process to generate that image. Because showdown is fully
 * synchronous, it is not possible to do this any other way.
 *
 * This must be a language extension to run before other conversions (such as _ used for
 * italics), so it generates a placeholder text that we go back to fill in later
 */
function showdownLatex(center, match, latex) {
	var md5 = crypto.createHash('md5');
	md5.update(latex, 'utf8');

	var hash = md5.digest('hex');
	var count = 0;

	var id = hash + '-' + count;
	var search = true;
	while (search) {
		// Check if the cache entry matches or not
		if (undefined !== latex_cache[id]) {
			var entry = latex_cache[id];

			// Same expression
			if (entry.latex == latex) {
				search = false;
			}
			else {
				// Linearly chain with a new counter for the id
				count += 1;
				id = hash + '-' + count;
			}
		}
		else {
			// No existing representation, save this to the table
			search = false;
			latex_cache[id] = {
				latex : latex,
				started : false,
				id : id,
				center : center,
				path : '/' + default_options.path + '/' + id + '.png'
			};
		}
	}

	// Set up an async task to populate the images and ignore its result
	var env = new fl.Environment({
		id : id,
		file : id,
		latex : latex,
		options : default_options
	});
	generateLatex.call(null, env, function() {});

	return '%LATEX'+id+'%';
}

/**
 * Replace the dummy string from earlier with the final image string
 */
function showdownLatexFinalizer(match, id) {
	var latex = latex_cache[id].latex;
	var path = latex_cache[id].path;
	var img = '<img class="latex-image" src="'+path+'"'
			+ ' title="'+latex+'" alt="'+latex+'" />';

	if (latex_cache[id].center) {
		return '<div style="text-align: center;">'+img+'</div>';
	}
	return img;
}

showdown.extension('latex', function() {
	return [{
		type : 'lang',
		regex : /¨D¨D([^¨]+)¨D¨D/g,
		replace : showdownLatex.bind(null, true)
	}, {
		type : 'lang',
		regex : /¨D([^¨]+)¨D/g,
		replace : showdownLatex.bind(null, false)
	}, {
		type : 'output',
		regex : /%LATEX([a-z0-9-]+)%/g,
		replace : showdownLatexFinalizer
	}];
});

module.exports = {};
