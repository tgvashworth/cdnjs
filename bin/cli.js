#!/usr/bin/env node

'use strict';

var path = require('path');
var fs = require('fs');

require('colors');
var program = require('commander');
var _ = require ('lodash');
var async = require('async');

var pkg = require('../package.json');
var cdnjs = require('../cdn.js');

var pad = function (str, len) {
  if (len % 2 === 0) len += 2;
  else if (len % 2 === 1) len += 3;
  while (str.length < len) {
    str += ' ';
  }
  return '    ' + str;
}

// Usage
program
  .version(pkg.version)
  .usage('[<options>] {search|url|update} [<args>]')
  .option('-q, --quiet', 'quiet mode')
  .on('--help', function() {
    console.log(fs.readFileSync('help-examples.txt', 'utf-8'));
  })
  .parse(process.argv);

var persistencePath = path.join (process.env.HOME, '.cdnjs', 'libraries.json');

var getPersistence = function (callback) {
  async.waterfall ([
    function (next) {
      fs.stat (persistencePath, function (err, stats) {
        if (err || !stats.isFile ()) {
          next (new Error ('No local cache found'), null);
        } else {
          fs.readFile (persistencePath, function (err, cache) {
            var libraries, err;
            try {
              libraries = JSON.parse (cache);
            } catch (e) {
              err = e;
            }
            next (err, libraries);
          }.bind (this));
        }
      }.bind (this));
    }
  ], function (err, libraries) {
    if (!err) {
      callback (libraries);
    } else {
      if (err.toString ().match (/No local cache found/)) {
        if (!program.quiet) console.error ('  No local cache found, please run `cdnjs update` first'.red);
        else console.error ('No local cache found');
      } else if (err instanceof SyntaxError) {
        if (!program.quiet) {
          console.error ('  Unable to parse the cache file, please run `cdnjs update`.'.red);
          console.error ('  If the problem persists, remove the folder ~/.cdnjs before running `cdnjs update`.'.red);
          console.error ('  If this doesn\'t solve the problem, check your version of cdnjs and/or\n      submit an issue at https://github.com/phuu/cdnjs/issues'.red);
          console.error (err);
        } else {
          console.error ('Unable to parse the cache file:', err);
        }
      } else {
        if (!program.quiet) console.error (('  An unknown error happened: \n').red, err);
        else console.error ('An unknown error happened:', err);
      }
    }
  });
};

var setPersistence = function (cache, callback) {
  var folder = path.dirname (persistencePath);
  async.waterfall ([
    function (next) {
      fs.exists (folder, function (exists) {
        next (null, exists);
      });
    },
    function (isDirectory, next) {
      if (!isDirectory) {
        fs.mkdir (folder, function (err) {
          next (err);
        });
      } else {
        next (null);
      }
    },
    function (next) {
      fs.writeFile (persistencePath, JSON.stringify (cache), function (err) {
        next (err);
      }.bind (this));
    },
  ], function (err) {
    callback (err);
  });
};

// Show help when used with no args
if (program.args.length === 0) { return com.help(); }

var method = program.args[0];
var term = program.args[1];

if (!term && !_.includes (['update', 'search', 'url'], method)) {
  if (!program.quiet) console.log('  Unknown method, assuming search.\n'.yellow);
  term = method;
  method = 'search';
}

if (method === 'update') {
  if (!program.quiet) console.log ('  Updating local cache...'.blue);
  cdnjs.libraries (['version'], function (err, libraries, total) {
    if (err) {
      if (!program.quiet) console.log ('  An error happened while retrieving the libraries from cdnjs.com.\nCheck your internet connection.\n'.red, err);
      else console.err ('An error happened while retrieving the libraries from cdnjs.com:', err);
    } else {
      setPersistence (libraries, function (err) {
        if (err) {
          if (!program.quiet) console.log ('  An error happened while writing the local cache.\nMake sure that you have the rights to write in ~/.cdnjs\n'.red, err);
          else console.error ('An error happened while writing the local cache:', err);
        } else {
          if (!program.quiet) {
            console.log (('  ' + total + ' libraries found.').green);
            console.log ('  Cache updated successfully.'.green);
          } else {
            console.log (total);
          }
        }
      });
    }
  });
} else if (method === 'search') {
  getPersistence (function (libraries) {
    if (!program.quiet) console.log ('  Searching for '.blue, term.green);
    var req = cdnjs.extractTerm (term);
    if (req.version) {
      if (!program.quiet) {
        console.log (('  Ignoring version number ' + req.version).yellow);
        console.log (('  To check cdnjs for version ' + req.version + ' of ' + req.name + ', run `cdnjs url ' + term + '`').yellow);
      }
    }
    cdnjs.search (libraries, req.name, function (err, results) {
      if (!program.quiet) console.log ('  Results: \n'.blue);
      if (results.exact) {
        var name = results.exact.name;
        var url = results.exact.latest;
        if (!program.quiet) console.log (pad (name+'*', results.longestName).green + (': ' + url).grey);
        else console.log (name + ':' + url);
      }
      results.partials.forEach (function (lib) {
        if (!program.quiet) console.log (pad (lib.name, results.longestName) + (': ' + lib.latest).grey);
        else console.log (lib.name + ':' + lib.version + ':' + lib.latest);
      });
      if (!results.exact && !results.partials.length) {
        if (!program.quiet) console.log ('  No result found for library', term.green);
      }
    });
  });
} else if (method === 'url') {
  getPersistence (function (libraries) {
    if (!program.quiet) console.log ('  Getting url for '.blue, term.green);
    var req = cdnjs.extractTerm (term);
    cdnjs.url (libraries, req.name, req.version, function (err, result, version) {
      if (!program.quiet) console.log ('  Result: \n'.blue);
      if (!err) {
        if (result) {
          if (!program.quiet) console.log (pad (req.name + (version ? '@' + version : ''), req.name.length).green + (': ' + result).grey);
          else console.log (req.name + (version ? ':' + version : '') + ':' + result);
        } else {
          if (!program.quiet) console.log ('  No result found for library', req.name.green, version ? ('with version ' + version.green) : '');
        }
      } else {
        if (!program.quiet) console.error (('  An unknown error happened; make sure that cdnjs.com is still up.\n').red, err);
        else console.error ('An unknown error happened:', err);
      }
    });
  });
} else {
}

