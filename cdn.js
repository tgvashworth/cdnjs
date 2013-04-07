#!/usr/bin/env node

var https = require('https')
  , util = require('util');

// Search methods (return array)

var search_by = function (key, term, array) {
  var matches = [];
  array.some(function (item) {
    if( item[key] ) {
      if( (''+item[key]).toLowerCase().indexOf(term) !== -1 ) {
        matches.push(item);
      }
    }
  });
  return matches;
};

var pad = function (str, len) {
  while( str.length < len ) {
    str += ' ';
  }
  return str;
};

var search_by_name = search_by.bind(null, 'name');
var search_by_filename = search_by.bind(null, 'filename');
var search_by_description = search_by.bind(null, 'description');

// Find methods (returns object or false)

var find_by = function (key, term, array) {
  var match;
  array.some(function (item) {
    return item[key] && item[key] === term && (match = item) && true;
  });
  return match;
};

var find_by_name = find_by.bind(null, 'name');
var find_by_filename = find_by.bind(null, 'filename');
var find_by_description = find_by.bind(null, 'description');

// Build cdnjs URL

var build_url = function (pkg) {
  var base = "http://cdnjs.cloudflare.com/ajax/libs/";
  return base + [pkg.name, pkg.version, pkg.filename || pkg.name].join('/');
};

// The main cdnjs object

var cdnjs = {
  packages: function (cb) {
    https.get('https://raw.github.com/cdnjs/website/gh-pages/packages.json', function (res) {
      var file = '';
      res.on('data', function (data) {
        file += data;
      });
      res.on('end', function (data) {
        if( data ) file += data;
        var raw = JSON.parse(file);
        if( raw && raw.packages ) {
          cb(null, raw.packages);
        }
      });
    }).on('error', cb);
  },
  search: function (term, cb) {
    this.packages(function (err, packages) {
      if( err ) return cb(err);
      var results = search_by_name(term, packages).map(function (pkg) {
        return pad(pkg.name, 30) + ': ' + build_url(pkg);
      });
      if( results.length === 0 ) err = new Error("No matching packages found.");
      cb(err, results);
    });
  },
  url: function (term, cb) {
    this.packages(function (err, packages) {
      if( err ) return cb(err);
      var pkg = find_by_name(term, packages);
      if( pkg ) {
        cb(null, build_url(pkg));
      } else {
        cb(new Error("No package found."));
      }
    });
  }
};

// Handle command line usage

if( process.argv.length > 2 ) {
  (function () {
    var method = process.argv[2],
        term = process.argv[3];
    if( ! (method && term) ) return console.log("Missing method or search term.") && process.exit(1);
    if( ! cdnjs[method] ) return console.log("Unknown method.") && process.exit(1);
    var result = cdnjs[method](term, function (err, result) {
      if( err ) return console.log(err) && process.exit(1);
      if( (! result) ) return console.log("Nothing found.") && process.exit(1);

      if( util.isArray(result) ) {
        console.log( result.join('\n') );
      } else {
        console.log( result );
      }
    });
  }());
}

// Export the API
module.exports = cdnjs;