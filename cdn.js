#!/usr/bin/env node

var request = require('request'),
    util = require('util'),
    moment = require('moment'),
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

var toggleExtension = function (name) {
    var endsWithJS = /\.js$/;
    if (endsWithJS.test(name)) {
        name = name.replace(endsWithJS, '');
    }
    else {
        name += '.js';
    }
    return name;
};

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
   * Build a usable package object with versions
   */
  buildPackage: function (pkg) {
    pkg.assets = pkg.assets || [];
    return {
      name: pkg.name,
      url: this.buildUrl(pkg),
      versions: pkg.assets.reduce(function (memo, asset) {
        memo[asset.version] = this.buildUrl({
          name: pkg.name,
          version: asset.version,
          filename: pkg.filename || pkg.name
        });
        return memo;
      }.bind(this), {})
    };
  },
  /**
   * Extract package name and version from search term
   */
  extractTerm: function (term) {
    var segments = term.split('@');
    return {
      name: segments[0],
      version: segments[1]
    };
  },
  /**
   * Get the correct version for a given package
   */
  getVersion: function (version, pkg) {
    if (!version) return pkg;
    if (pkg.url.indexOf(version) !== -1) return pkg;
    if (!pkg.versions[version]) return pkg;
    pkg.url = pkg.versions[version];
    pkg.name = pkg.name + '@' + version;
    return pkg;
  },
  /**
   * Cached list of packages
   * Why is this not cached to a file? Becuase the global tool should always go
   * looking properly, but a module using cdnjs (like an API) will keep it in
   * memory so it needs recaching after 24 hours.
   */
  cache: null,
  /**
   * Grab the packages from the local cache, or cdnjs.
   */
  packages: function (cb) {
    // If we've got the packages cached use them, but only if it's not expired.
    if (this.cache && this.cache.packages) {
      if (moment().isBefore(this.cache.expires)) {
        return cb(null, this.cache.packages, true);
      }
    }
    // Grab some JSON from the cdnjs list
    request
      .get({ url: this.urls.packages, json:true }, function (err, res, body) {
        if (err) return cb(err);
        // The wrong thing came back, gtfo
        if (!(body && body.packages)) return cb(null, []);
        // Cache the good stuff, and set and expiry time
        this.cache = body;
        this.cache.expires = moment().add('hours', 24);
        // Send the packages on back
        return cb(null, body.packages);
      }.bind(this));
  },
  /**
   * Search the packages list for an identifier. Loosey-goosey.
   */
  search: function (term, cb) {
    term = this.extractTerm(term);
    this.packages(function (err, packages) {
      if (err) return cb(err);
      // Loosely search the names of the packages, then trasform them into a
      // usable format.
      var results = searchByName(term.name, packages).map(this.buildPackage.bind(this));
      if (!results.length) return cb(new Error("No matching packages found."));
      return cb(null, results);
    }.bind(this));
  },
  /**
   * Get a URL for an exact identifier match.
   */
  url: function (term, cb) {
    term = this.extractTerm(term);
    this.packages(function (err, packages) {
      if (err) return cb(err);
      var pkg = findByName(term.name, packages);
      if (!pkg) pkg = findByName(toggleExtension(term.name), packages);
      if (!pkg) return cb(new Error("No such package found."));
      var version = this.getVersion(term.version, this.buildPackage(pkg));
      return cb(null, version);
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