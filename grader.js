#!/usr/bin/env node

/*
 Automatically grade files for the presence of specified HTML tags/attributes.
 Uses commander.js and cheerio. Teaches command line application development
 and basic DOM parsing.

 References:

 + cheerio
 - https://github.com/MatthewMueller/cheerio
 - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
 - http://maxogden.com/scraping-with-node.html

 + commander.js
 - https://github.com/visionmedia/commander.js
 - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
 - http://en.wikipedia.org/wiki/JSON
 - https://developer.mozilla.org/en-US/docs/JSON
 - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var console = require('console');
//var HTMLFILE_DEFAULT = "index.html";
//var URL_DEFAULT = "";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {

    var instr = infile.toString();

    if (!fs.existsSync(instr)) {
	console.error("The file %s does not exist. Exiting.", instr);
	process.exit(1);    // http://nodejs.org/api/process.html#process_process_exit_code
    }

    return instr;
};


var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {

    $ = cheerioHtmlFile(htmlfile);

    return checkCheerioData($, checksfile);
};

var checkUrlContent = function(url, checksfile) {

    rest.get(url).on('complete', function(data) {

	if (data instanceof Error) {
	    console.error("The url %s does not exist.", url);
	} else {
	    $ = cheerio.load(data);
	    var out = checkCheerioData($, checksfile);
	    console.log(JSON.stringify(out, null, 4));
	}
    });

};

var checkCheerioData = function(cheerioDataFunc, checksfile) {

    var checks = loadChecks(checksfile);
    var out = {};

    for (var ii in checks) {
	out[checks[ii]] = $(checks[ii]).length > 0;
    }

    return out;

};

// 1. asserts that only one of htmlfile and checksfile is defined
// 2. check the one that's defined
var assertOnlyOneOfFileOrUrl = function(htmlfile, url) {

    if (htmlfile===undefined && url===undefined) {
	console.error("At least one of file and url path must be defined. Exiting.");
	process.exit(1);
    } else if (!(htmlfile===undefined || url===undefined)) {
	console.error("Only one of file and url paths can be defined. Exiting.");
	process.exit(1);
    }
};

var clone = function(fn) {
    // workaround for commander.js issue (http://stackoverflow.com/a/6772648)
    return fn.bind({});
};

if (require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
	.option('-u, --url <url_path>', 'Url address')
	.parse(process.argv);

    assertOnlyOneOfFileOrUrl(program.file, program.url);

    if (program.file) {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    } else {
	checkUrlContent(program.url, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkUrlContent = checkUrlContent;
}
