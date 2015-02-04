'use strict';

// Example module use

var cdnjs = require('./cdn.js'),
    util = require('util');

cdnjs.libraries(function (err, libraries) {
  cdnjs.search (libraries, 'knockout', function (err, results) {
    console.log('search:', util.inspect(results, {
      depth: null,
      colors: true
    }));
  });

  cdnjs.url(libraries, 'angular.js', function (err, packages) {
    console.log('url:', util.inspect(packages, {
      depth: null,
      colors: true
    }));
  });

  cdnjs.url(libraries, 'angular.js', '1.0.0', function (err, packages) {
    console.log('versioned url:', util.inspect(packages, {
      depth: null,
      colors: true
    }));
  });
});
