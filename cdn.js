'use strict';

var path = require('path');
var fs = require('fs');

var request = require('request');
//TODO: use UserAgent
//TODO: use cli-color
var _ = require('lodash');
var async = require('async');

var persistencePath = path.join (process.env.HOME, '.cdnjs', 'libraries.json');

var cdnjs = {

  apiUrl: 'http://api.cdnjs.com/libraries',

  libraries: function (name, fields, callback) {
    if ('function' === typeof name) {
      callback = name;
      name = null;
      fields = null;
    } else if ('function' === typeof fields) {
      callback = fields;
      if ('object' === typeof name) {
        fields = name
        name = null;
      }
    }

    var url = this._buildUrl (name, fields);
    this._getLibraries (url, callback);
  },

  _getLibraries: function (url, callback) {
    var params = {
      url: url,
      json: true
    };

    request
      .get (params, function (err, res, body) {
        var total, results;
        if (!err) {
          total = body.total;
          results = body.results;
        }
        callback (err, results, total);
      }.bind (this));
  },

  _buildUrl: function (name, fields) {
    var url = this.apiUrl;
    if (name || fields) {
      url += '?';
    }
    if (name) {
      url += 'search=' + name;
    }
    if (name && fields) {
      url += '&';
    }
    if (fields) {
      url += 'fields=' + fields.join (',');
    }
    return url;
  },

  search: function (libraries, name, callback) {
    var results = {
      exact: null,
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
  },

  url: function (libraries, name, version, callback) {
    if ('function' === typeof version) {
      callback = version;
      version = null;
    }
    this.search (libraries, name, function (err, results) {
      var library = null;
      if (results.exact) {
        library = results.exact;
      } else if (results.partials.length){
        library = results.partials[0];
      }

      if (library) {
        var url = library.latest;
        if (version) {
          var latest = library.version;
          url = url.replace (RegExp ('(//cdnjs.cloudflare.com/ajax/libs/.*/)' + latest + '(.*)'), '$1' + version + '$2');
          this._getUrl ('http:' + url, function (err, exists) {
            if (!err && exists) {
              callback (err, url, version);
            } else {
              callback (err, null, version);
            }
          });
        } else {
          callback (null, url, version);
        }
      } else {
        callback (null, null, null);
      }
    }.bind (this));
  },

  _getUrl: function (url, callback) {
    request
      .get ({ url: url }, function (err, res, body) {
        var code = res.statusCode;
        if (!err) {
          if (code === 200) {
            callback (err, true);
          } else if (code === 404) {
            callback (err, false);
          } else {
            callback (new Error ('Unknown Server Error: ' + code), false);
          }
        } else {
          callback (err, false);
        }
      }.bind (this));
  },

  setPersistence: function (cache, filepath, callback) {
    if ('string' !== typeof filepath) {
      callback = filepath;
      filepath = persistencePath;
    }

    var folder = path.dirname (filepath);
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
        fs.writeFile (filepath, JSON.stringify (cache), function (err) {
          next (err);
        }.bind (this));
      },
    ], function (err) {
      callback (err);
    });
  },

  getPersistence: function (filepath, callback) {
    if ('function' === typeof filepath) {
      callback = filepath;
      filepath = persistencePath;
    }

    fs.stat (filepath, function (err, stats) {
      if (err || !stats.isFile ()) {
        callback (new Error ('No local cache found'), null);
      } else {
        fs.readFile (filepath, function (err, cache) {
          var libraries, err;
          try {
            libraries = JSON.parse (cache);
          } catch (e) {
            err = e;
          }
          callback (err, libraries);
        }.bind (this));
      }
    }.bind (this));
  },

  extractTerm: function (term) {
    var segments = term.split ('@');
    return {
      name: segments[0],
      version: segments[1]
    };
  },

};

// Export the API
module.exports = cdnjs;
