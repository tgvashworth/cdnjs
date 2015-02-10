'use strict';

var fs = require('fs');

var request = require('request');
var _ = require('lodash');
var pkg = require ('./package.json');

//TODO: use a UserAgent with request

var cdnjs = {

  api: {
    url: 'http://api.cdnjs.com/libraries',
    headers: {
      'User-Agent': pkg.name + '/' + pkg.version + ' (Node.js Module and CLI) (+http://www.npmjs.com/package/' + pkg.name + ')'
    }
  },

  /* 
   * Gets libraries from api.cdnjs.com
   */
  libraries: function (name, fields, callback) {
    if ('function' === typeof name) {
      callback = name;
      name = null;
      fields = [];
    } else if ('function' === typeof fields) {
      callback = fields;
      if ('object' === typeof name) {
        fields = name;
        name = null;
      } else {
        fields = [];
      }
    }

    if (fields.indexOf ('version') === -1) {
      fields.push ('version');
    }
    var url = this._buildUrl (name, fields);
    this._getLibraries (url, callback);
  },

  /*
   * An helper method that performs the actual request.
   */
  _getLibraries: function (url, callback) {
    var params = {
      url: url,
      json: true,
      headers: this.api.headers
    };

    request
      .get (params, function (err, res, body) {
        var total, results;
        if (!err) {
          total = body.total;
          results = _.sortBy (body.results, 'name');
        }
        callback (err, results, total);
      }.bind (this));
  },

  /*
   * Returns an API url from a library name and optional fields.
   */
  _buildUrl: function (name, fields) {
    var url = this.api.url;
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

  /*
   * Searches among the results of an api call (the libraries).
   */
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

  /*
   * Gets the url from the results of an API call (the libraries).
   */
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
        if (version && version !== library.version) {
          var latest = library.version;
          url = url.replace (new RegExp ('(//cdnjs.cloudflare.com/ajax/libs/.*/)' + latest + '(/.*)'), '$1' + version + '$2');
          this._getUrl ('http:' + url, function (err, exists) {
            if (!err && exists) {
              callback (err, url, version);
            } else {
              callback (err, null, latest);
            }
          });
        } else {
          callback (null, url, null);
        }
      } else {
        callback (null, null, null);
      }
    }.bind (this));
  },

  /*
   * Helper method that performs the actual url request.
   * It handles the possible error cases.
   */
  _getUrl: function (url, callback) {
    var params = {
      url: url,
      headers: this.api.headers
    };

    request
      .get (params, function (err, res, body) {
        if (!err) {
          var code = res.statusCode;
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

  /*
   * Extracts the package name and version from a string.
   * foobar@0.0.1 => { name: 'foobar', version: '0.0.1' }
   */
  extractTerm: function (term) {
    var segments = term.split ('@');
    return {
      name: segments[0],
      version: segments[1]
    };
  }

};

// Export the API
module.exports = cdnjs;
