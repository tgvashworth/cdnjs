#!/usr/bin/env node

var request = require('request'),
    util = require('util'),
    colors = require('colors');

// Search methods (return array)

var searchBy = function (key, term, array) {
  var matches = [];
  array.some(function (item) {
    if (item[key]) {
      if ((''+item[key]).toLowerCase().indexOf(term) !== -1) {
        matches.push(item);
      }
    }
  });
  return matches;
};

var pad = function (str, len) {
  while( str.length < len) {
    str += ' ';
  }
  return str;
};

var searchByName = searchBy.bind(null, 'name');
var searchByFilename = searchBy.bind(null, 'filename');
var searchByDescription = searchBy.bind(null, 'description');

// Find methods (returns object or false)

var findBy = function (key, term, array) {
  var match;
  array.some(function (item) {
    return item[key] && item[key] === term && (match = item) && true;
  });
  return match;
};

var findByName = findBy.bind(null, 'name');
var findByFilename = findBy.bind(null, 'filename');
var findByDescription = findBy.bind(null, 'description');

// The main cdnjs object

var cdnjs = {
  urls: {
    packages: 'https://raw.github.com/cdnjs/website/gh-pages/packages.json',
    base: '//cdnjs.cloudflare.com/ajax/libs/'
  },
  /**
   * Build a cdnjs URL for the given package
   */
  buildUrl: function (pkg) {
    var base = this.urls.base;
    return base + [pkg.name, pkg.version, pkg.filename || pkg.name].join('/');
  },
  /**
   * Grab the packages from the local cache, or cdnjs
   */
  packages: function (cb) {
    request
      .get({ url: this.urls.packages, json:true }, function (err, res, body) {
        if (err) return cb(err);
        if (!(body && body.packages)) return cb(null, []);
        cb(null, body.packages);
      });
  },
  search: function (term, cb) {
    this.packages(function (err, packages) {
      if (err) return cb(err);
      var results = searchByName(term, packages).map(function (pkg) {
        return {
          name: pkg.name,
          url: this.buildUrl(pkg)
        };
      }.bind(this));
      if (results.length === 0) err = new Error("No matching packages found.");
      cb(err, results);
    }.bind(this));
  },
  url: function (term, cb) {
    this.packages(function (err, packages) {
      if (err) return cb(err);
      var pkg = findByName(term, packages);
      if (pkg) {
        cb(null, {
          name: pkg.name,
          url: this.buildUrl(pkg)
        });
      } else {
        cb(new Error("No such package found."));
      }
    }.bind(this));
  }
};

// Handle command line usage

if (process.argv.length > 2) {
  (function () {
    var method = process.argv[2],
        term = process.argv[3];
    if (! cdnjs[method]) {
      console.log("Unknown method, assuming search.".red);
      if (! term) { term = method; }
      method = 'search';
    }
    var result = cdnjs[method](term, function (err, results) {
      if (err) return console.log((''+err).red) && process.exit(1);
      if ((!results)) return console.log("Error: Nothing found.".red) && process.exit(1);

      if (!util.isArray(results)) results = [results];

      results.forEach(function (result) {
        var name = pad(result.name, 30);
        if (term === result.name) name = name.green;
        console.log( name + (': ' + result.url).grey );
      });
    });
  }());
}

// Export the API
module.exports = cdnjs;