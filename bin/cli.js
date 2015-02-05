#!/usr/bin/env node

'use strict';

var path = require('path');
var fs = require('fs');

var colors = require('colors/safe');
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
};

// Usage
program
  .version(pkg.version)
  .usage('[<options>] {search|url|update} [<args>]')
  .option('-q, --quiet', 'quiet mode')
  .on('--help', function() {
    console.log(fs.readFileSync('./bin/help-examples.txt', 'utf-8'));
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
            if (err) {
              next (err, null);
            } else {
              var libraries;
              err = null;
              try {
                libraries = JSON.parse (cache);
              } catch (e) {
                err = e;
              }
              next (err, libraries);
            }
          }.bind (this));
        }
      }.bind (this));
    }
  ], function (err, libraries) {
    if (!err) {
      callback (libraries);
    } else {
      if (err.toString ().match (/No local cache found/)) {
        if (!program.quiet) console.error (colors.red ('  No local cache found, please run `cdnjs update` first'));
        else console.error ('No local cache found');
      } else if (err instanceof SyntaxError) {
        if (!program.quiet) {
          console.error (colors.red ('  Unable to parse the cache file, please run `cdnjs update`.'));
          console.error (colors.red ('  If the problem persists, remove the folder ~/.cdnjs before running `cdnjs update`.'));
          console.error (colors.red ('  If this doesn\'t solve the problem, check your version of cdnjs and/or\n      submit an issue at https://github.com/phuu/cdnjs/issues'));
          console.error (err);
        } else {
          console.error ('Unable to parse the cache file:', err);
        }
      } else {
        if (!program.quiet) console.error (colors.red ('  An unknown error happened: \n'), err);
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
if (program.args.length === 0) { return program.help(); }

var method = program.args[0];
var term = program.args[1];

if (!term && !_.includes (['update', 'search', 'url'], method)) {
  if (!program.quiet) console.log(colors.yellow ('  Unknown method, assuming search.\n'));
  term = method;
  method = 'search';
}

if (method === 'update') {
  if (!program.quiet) console.log (colors.blue ('  Updating local cache...'));
  cdnjs.libraries (['version'], function (err, libraries, total) {
    if (err) {
      if (!program.quiet) console.log (colors.red ('  An error happened while retrieving the libraries from cdnjs.com.\nCheck your internet connection.\n'), err);
      else console.err ('An error happened while retrieving the libraries from cdnjs.com:', err);
    } else {
      setPersistence (libraries, function (err) {
        if (err) {
          if (!program.quiet) console.log (colors.red ('  An error happened while writing the local cache.\nMake sure that you have the rights to write in ~/.cdnjs\n'), err);
          else console.error ('An error happened while writing the local cache:', err);
        } else {
          if (!program.quiet) {
            console.log (colors.green ('  ' + total + ' libraries found.'));
            console.log (colors.green ('  Cache updated successfully.'));
          } else {
            console.log (total);
          }
        }
      });
    }
  });
} else if (method === 'search') {
  getPersistence (function (libraries) {
    if (!program.quiet) console.log (colors.blue ('  Searching for '), colors.green (term));
    var req = cdnjs.extractTerm (term);
    if (req.version) {
      if (!program.quiet) {
        console.log (colors.yellow ('  Ignoring version number ' + req.version));
        console.log (colors.yellow ('  To check cdnjs for version ' + req.version + ' of ' + req.name + ', run `cdnjs url ' + term + '`'));
      }
    }
    cdnjs.search (libraries, req.name, function (err, results) {
      if (!program.quiet) console.log (colors.blue ('  Results: \n'));
      if (results.exact) {
        var name = results.exact.name;
        var url = results.exact.latest;
        var version = results.exact.version;
        if (!program.quiet) console.log (colors.green (pad (name+'*', results.longestName)) + colors.grey (': ' + url));
        else console.log (name + ' ' + version + ' ' + url);
      }
      results.partials.forEach (function (lib) {
        if (!program.quiet) console.log (pad (lib.name, results.longestName) + colors.grey ((': ' + lib.latest)));
        else console.log (lib.name + ' ' + lib.version + ' ' + lib.latest);
      });
      if (!results.exact && !results.partials.length) {
        if (!program.quiet) console.log ('  No result found for library', colors.green (term));
      }
    });
  });
} else if (method === 'url') {
  getPersistence (function (libraries) {
    if (!program.quiet) console.log (colors.blue ('  Getting url for '), colors.green (term));
    var req = cdnjs.extractTerm (term);
    cdnjs.url (libraries, req.name, req.version, function (err, result, version) {
      if (!program.quiet) console.log (colors.blue ('  Result: \n'));
      if (!err) {
        if (result) {
          if (!program.quiet) console.log (colors.green (pad (req.name + (version ? '@' + version : ''), req.name.length)) + colors.grey (': ' + result));
          else console.log (req.name + (version ? ' ' + version : '') + ' ' + result);
        } else {
          if (!program.quiet) console.log ('  No result found for library', colors.green (req.name), version ? ('with version ' + colors.green (version)) : '');
        }
      } else {
        if (!program.quiet) console.error (colors.red ('  An unknown error happened; make sure that cdnjs.com is still up.\n'), err);
        else console.error ('An unknown error happened:', err);
      }
    });
  });
} else {
  if (!program.quiet) console.error (colors.red ('  Unknown command ' + method + '. Run `cdnjs --help` for a list of available commands.'));
  else console.error ('Unknown command ' + method + '.');
}

