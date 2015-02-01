#!/usr/bin/env node

'use strict';

require('colors');
var com = require('commander');
var fs = require('fs');
var pkg = require('../package.json');

var cdnjs = require('../cdn.js');

var pad = function (str, len) {
  if (len % 2 === 0) len += 2;
  else if (len % 2 === 1) len += 3;
  while (str.length < len) {
    str += ' ';
  }
  return '      ' + str;
}

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

if (method === 'update') {
  console.log ('    ==> Updating local cache...'.blue);
  cdnjs.update (function (err, libraries) {
    if (err) {
      console.log ('    ==> An error happened while retrieving the libraries from cdnjs.com.\nCheck your internet connection.'.red);
    } else {
      cdnjs._setLocalCache (libraries, function (err) {
        if (err) {
          console.log ('    ==> An error happened while writing the local cache.\nMake sure that you have the rights to write in ~/.cdnjs'.red);
        } else {
          console.log ('    ==> Cache updated successfully.'.green);
        }
      });
    }
  });
} else {
  cdnjs.setMemoryCache (function (err) {
    if (!err) {
      console.log ('    ==> Searching for '.blue, term.green);
      cdnjs.search (term, function (err, results) {
        console.log ('    ==> Results: \n'.blue);
        var name = results.exact.name;
        var url = results.exact.latest;
        console.log (pad (name+'*', results.longestName).green + (': ' + url).grey);
        results.partials.forEach (function (lib) {
          console.log (pad (lib.name, results.longestName) + (': ' + lib.latest).grey);
        });
      });
    } else {
      console.log ('    ==> No local cache found, please run `cdnjs update` first'.red);
    }
  });
}

/*
if (!cdnjs[method]) {
  console.log('Unknown method, assuming search.'.yellow);
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
*/
