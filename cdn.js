'use strict';

var path = require('path');
var fs = require('fs');

var request = require('request');
var moment = require('moment');
var _ = require('lodash');
var async = require('async');

var cacheFolder = path.join (process.env.HOME, '.cdnjs');
var cacheFile = path.join (cacheFolder, 'librairies.json');

var cdnjs = {
  api: {
    url: 'http://api.cdnjs.com/libraries',
    params: {
      version: '?fields=version',
      all: '?fields=version,description,homepage,keywords,maintainers,assets'
    }
  },

  cache: {
    libraries: [],
    expires: moment ().add (24, 'hours')
  },

  update: function (callback) {
    this.getAllLibraries (function (err, total, results) {
      this.cache.libraries = results;
      this.cache.expires = moment ().add (24, 'hours');
      callback (err, this.cache.libraries);
    }.bind (this));
  },

  getAllLibraries: function (callback) {
    var params = {
      url: this.api.url + this.api.params.version,
      json: true
    };

    request
      .get (params, function (err, res, body) {
        var total, results;
        if (!err) {
          total = body.total;
          results = body.results;
        }
        callback (err, total, results);
      }.bind (this));
  },

  search: function (name, callback) {
    this.getCache (function (libraries) {
      var results = {
        exact: {},
        partials: [],
        longestName: 0
      };
      libraries.forEach (function (lib) {
        if (lib.name.match (new RegExp (name)) || lib.name === name) {

          lib.latest = lib.latest.replace (/^http:/, '');
          if (lib.name === name) {
            results.exact = lib;
          } else {
            results.partials.push (lib);
          }

          if (lib.name.length > results.longestName) {
            results.longestName = lib.name.length;
          }
        }
      });
      callback (null, results);
    });
  },

  setMemoryCache: function (callback) {
    fs.stat (cacheFile, function (err, stats) {
      if (err || !stats.isFile ()) {
        callback (new Error ('No local cache found'));
      } else {
        this.getLocalCache (function (cache) {
          this.cache.libraries = JSON.parse (cache);
          this.cache.expires = moment ().add (24, 'hours');
          callback (null);
        }.bind (this));
      }
    }.bind (this));
  },

  getLocalCache: function (callback) {
    fs.readFile (cacheFile, function (err, cache) {
      callback (cache);
    }.bind (this));
  },

  _setLocalCache: function (cache, callback) {
    async.waterfall ([
      function (next) {
        fs.exists (cacheFolder, function (exists) {
          next (null, exists);
        });
      },
      function (isDirectory, next) {
        if (!isDirectory) {
          fs.mkdir (cacheFolder, function (err) {
            next (err);
          });
        } else {
          next (null);
        }
      },
      function (next) {
        fs.writeFile (cacheFile, JSON.stringify (cache), function (err) {
          next (err);
        }.bind (this));
      },
    ], function (err) {
      callback (err);
    });
  },

  getCache: function (callback) {
    var cache = this.cache;
    // If there is no memory cache, we need to create it.
    // This will not happen with the cli client, since
    // the local cache is checked and the memory cache
    // is updated at launch.
    if (!cache) {
      update (function (cache) {
        callback (cache.libraries);
      });
    } else {
      // TODO: expiring
      callback (cache.libraries);
    }
  }

};

// Export the API
module.exports = cdnjs;
