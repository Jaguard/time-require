/**
 * gulpfile - Include gulp.js build tasks definitions
 *
 * @author Ciprian Popa (cyparu)
 * @since 0.0.1
 * @version 0.0.1
 */

"use strict";

var gulp = require("gulp"), //  http://gulpjs.com
		$ = require("gulp-load-plugins")(), // lazy loading plugins: https://github.com/jackfranklin/gulp-load-plugins
		sequence = require("run-sequence"), // specify run order https://github.com/OverZealous/run-sequence
		gutil = require("gulp-util"), // https://github.com/gulpjs/gulp
		log = gutil.log,
		colors = gutil.colors,
		// watching flag
		watching = false,
		// project config
		/* jshint -W015 */
		project = {
			js: ["*.js", "src/**/*.js", "test/**/*.js"], // include JavaScript files
			specs: ["test/**/*.spec.js"], // include JavaScript files
			md: ["*.md", "doc/*.md"], // include all markdown files
			json: ["*.json", ".*rc"], // include all json and rc files
			tmp: "target",  // target directory
			dist: "dist"  // dist directory
		};

// --------------------
// helper functions
// --------------------

/**
 * Pipe a cache with the specified name just if the current task was triggered by the watcher
 */
function cache(name) {
	return $.if(watching, $.cached(name));
}

/**
 * Add error notification for the specified stream using the type as a title prefix
 */
function notifyError(stream, type) {
	stream.on("error", function(err) {
		var title = type + " error",
				message = err.message;
		log(colors.red(title) + ": " + colors.yellow(message));
		$.notify({
			title: title,
			message: message
		});
	});
	return stream;
}

/**
 * Wrap src to automatically set the base to current working directory
 */
function src(glob, opt) {
	opt = opt || {};
	opt.base = opt.base || process.cwd();
	return gulp.src(glob, opt);
}

/**
 * Wrap gulp.task for more expressive usage
 */
function task(name, deps, fn) {
	return gulp.task(name, deps, fn);
}

/**
 * Wrap gulp.task usage for sequencial execution for more expressive usage
 */
function seqTask(name) {
	var tasks = Array.prototype.slice.call(arguments, 1);
	task(name, function(cb) { // run the tasks in the specified order
		tasks.push(cb);
		sequence.apply(undefined, tasks);
	});
}

/**
 * Wrap gulp.watch with file change reporting and watching flag setting for triggered tasks
 */
function watch(glob, opt, fn) {
	var watcher = gulp.watch(glob, opt, fn);
	// show change
	watcher.on("change", function(event) {
		// set watching flag
		watching = true;
		// log the change
		log("The file " + colors.yellow(event.path) + " was " + colors.green(event.type));
	});
	return watcher;
}

// --------------------
// tasks
// --------------------

// define "clean" task for cleaning all the generated and temporary files
task("clean", function() {
	log("Remove temporary files");
	return src(project.tmp, { read: false }).pipe($.clean());
});

// define "jslint" task for JavaScript linting
task("jshint", function() {
	log("Linting JavaScript files");
	return src(project.js)
		.pipe(cache("js")) // enable caching just when watching
		.pipe($.jshint())
		.pipe($.jshint.reporter("jshint-stylish"))
		.pipe($.if(!watching, notifyError($.jshint.reporter("fail"), "JSHint"))); // fail if not running under watcher
});

// define "jscs" task for JavaScript code style constraints
task("jscs", function() {
	log("Linting JavaScript files");
	return src(project.js)
		.pipe(cache("jscs")) // enable caching just when watching
		.pipe(notifyError($.jscs(), "JSCS"));
});

// define "jsonlint" task for JSON linting
task("jsonlint", function() {
	log("Linting JSON files");
	return src(project.json)
		.pipe(cache("json")) // enable caching just when watching
		.pipe($.jsonlint())
		.pipe($.jsonlint.reporter());
});

// define "md" task for HTML generation from .md files
task("md", function() {
	log("Generating HTML documentation from Markdown files");
	return src(project.md, { base: process.cwd() })
		.pipe(cache("md")) // enable caching just when watching
		.pipe($.markdown())
		.pipe(gulp.dest(project.tmp + "/doc/html"));
});

// define "mdpdf" task for PDF generation from .md files
task("mdpdf", function() {
	log("Generating PDF documentation from Markdown files");
	return src(project.md, { base: process.cwd() })
		.pipe(cache("md-pdf")) // enable caching just when watching
		.pipe($.markdownPdf())
		.pipe(gulp.dest(project.tmp + "/doc/pdf"));
});

// define "docco" task for annotated source code documentation
task("docco", function() {
	log("Generating Docco annotated documentation for JavaScript files");
	return src(project.js, { base: process.cwd() })
		.pipe(cache("docco")) // enable caching just when watching
		.pipe($.docco({ layout: "classic" }))
		.pipe(gulp.dest(project.tmp + "/doc/js/source"));
});

// define "jsdoc" task for API source code documentation
task("jsdoc", function() {
	log("Generating JSDoc3 API documentation for JavaScript files");
	return src(project.js, { base: process.cwd() })
		.pipe(cache("jdoc")) // enable caching just when watching
		.pipe($.jsdoc(project.tmp + "/doc/js/api"));
});

// define "test" for Jasmine testing
task("test", function() {
	log("Execute Jasmine tests/specs");
	return src(project.specs)
		.pipe(cache("specs")) // enable caching just when watching
		.pipe(notifyError($.jasmine({ verbose: true }),"Jasmine"));
});

// define "watch" task to start watch/interactive development mode
task("watch", function() {
	log("Watching project files...");
	watch(project.js, ["jshint", "jscs"]);
	watch(project.json, ["jsonlint"]);
	watch(project.specs, ["test"]);
});

// define top tasks & aliases
task("lint", ["jsonlint", "jshint", "jscs"]);
task("doc", ["jsdoc", "docco", "md"]); // TODO: "mdpdf" removed, pdf generation will block
seqTask("build", "clean", "lint", "test", "doc"); // run sequentially

// define default task
task("default", ["build"]);
