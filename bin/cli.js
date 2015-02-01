#!/usr/bin/env node

'use strict';

var fs = require('fs');

require('colors');
var com = require('commander');
var _ = require ('lodash');

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
  .usage('[-q] <search|url> library')
  .option('-q, --q', 'Quiet mode: output URLs only')
  .on('--help', function() {
    console.log(fs.readFileSync('help-examples.txt', 'utf-8'));
  })
  .parse(process.argv);

console.log();

// Show help when used with no args
if (com.args.length === 0) { return com.help(); }

var method = com.args[0];
var term = com.args[1];

if (!term || !_.includes (['update', 'search'], method)) {
  console.log('    ==> Unknown method, assuming search.\n'.yellow);
  term = method;
  method = 'search';
}

if (method === 'update') {
  console.log ('    ==> Updating local cache...'.blue);
  cdnjs.libraries (['version'], function (err, libraries, total) {
    if (err) {
      console.log ('    ==> An error happened while retrieving the libraries from cdnjs.com.\nCheck your internet connection.'.red);
    } else {
      cdnjs.setPersistence (libraries, function (err) {
        if (err) {
          console.log ('    ==> An error happened while writing the local cache.\nMake sure that you have the rights to write in ~/.cdnjs'.red);
        } else {
          console.log (('    ==> ' + total + ' libraries found.').green);
          console.log ('    ==> Cache updated successfully.'.green);
        }
      });
    }
    console.log ();
  });
} else if (method === 'search') {
  cdnjs.getPersistence (function (err, libraries) {
    if (!err) {
      console.log ('    ==> Searching for '.blue, term.green);
      cdnjs.search (libraries, term, function (err, results) {
        console.log ('    ==> Results: \n'.blue);
        if (results.exact) {
          var name = results.exact.name;
          var url = results.exact.latest;
          console.log (pad (name+'*', results.longestName).green + (': ' + url).grey);
        }
        results.partials.forEach (function (lib) {
          console.log (pad (lib.name, results.longestName) + (': ' + lib.latest).grey);
        });
        if (!results.exact && !results.partials.length) {
          console.log ('    ==> No result found.');
        }
      });
    } else if (err.toString ().match (/No local cache found/)) {
      console.log ('    ==> No local cache found, please run `cdnjs update` first'.red);
    } else if (err instanceof SyntaxError) {
      console.log ('    ==> Unable to parse the cache file, please run `cdnjs update`.'.red);
      console.log ('    ==> If the problem persists, check your version of cdnjs and/or\n      submit an issue at https://github.com/phuu/cdnjs/issues'.red);
    } else {
      console.log (('    ==> An unknown error happened: ' + err).red);
    }
    console.log ();
  });
} else {
}

/*
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
