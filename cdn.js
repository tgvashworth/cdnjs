#!/usr/bin/env node

var https = require('https')
  , util = require('util');

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

var search_by_name = search_by.bind(null, 'name');
var search_by_filename = search_by.bind(null, 'filename');
var search_by_description = search_by.bind(null, 'description');

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

var build_url = function (pkg) {
  var base = "http://cdnjs.cloudflare.com/ajax/libs/";
  return base + [pkg.name, pkg.version, pkg.filename || pkg.name].join('/');
};

var packages;
var api = {
  search: function (term) {
    return search_by_name(term, packages).map(function (pkg) { return pkg.name; });
  },
  url: function (term) {
    var pkg = find_by_name(term, packages);
    if( pkg ) {
      return build_url(pkg);
    } else {
      return false;
    }
  }
};

var run = function () {
  var method = process.argv[2],
      term = process.argv[3];

  if( ! (method && term) ) return console.log("Missing method or search term.") && process.exit(-1);

  if( ! api[method] ) return console.log("Unknown method.") && process.exit(-1);

  var result = api[method](term);

  if( ! result ) return console.log("No results found.") && process.exit(-1);

  if( util.isArray(result) ) {
    console.log( result.join('\n') );
  } else {
    console.log( result );
  }
};

https.get('https://raw.github.com/cdnjs/website/gh-pages/packages.json', function (res) {
  var file = '';

  res.on('data', function (data) {
    file += data;
  });

  res.on('end', function (data) {
    if( data ) file += data;
    var raw = JSON.parse(file);
    if( raw && raw.packages ) {
      packages = raw.packages;
      run();
    }
  });
});