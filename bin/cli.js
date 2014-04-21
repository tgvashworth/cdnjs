#!/usr/bin/env node

'use strict';

require('colors');
var com = require('commander');
var fs = require('fs');
var pkg = require('../package.json');

var cdnjs = require('../cdn.js');


// Usage
com
  .version(pkg.version)
  .usage('[-u] <search|url> library')
  .option('-u, --url-only', 'Output only the url')
  .on('--help', function() {
    console.log(fs.readFileSync('help-examples.txt', 'utf-8'));
  })
  .parse(process.argv);

// Show help when used with no args
if (com.args.length === 0) { return com.help(); }

var method = com.args[0];
var term = com.args[1];

if (!cdnjs[method]) {
  console.log('Unknown method, assuming search.'.red);
  if (!term) { term = method; }
  method = 'search';
}

cdnjs[method](term, function (err, results) {
  if (err) { return console.log((''+err).red) && process.exit(1); }
  if (!results) { return console.log('Error: Nothing found.'.red) && process.exit(1); }

  if (!Array.isArray(results)) { results = [results]; }

  results.forEach(function (result) {
    if(com.urlOnly) { return console.log(result.url); }

    var name = pad(result.name, 30);
    if (term === result.name) { name = name.green; }
    console.log(
      name + (': ' + result.url).grey
    );
  });
});

// Utilities

function pad(str, len) {
  while (str.length < len) {
    str += ' ';
  }
  return str;
}
