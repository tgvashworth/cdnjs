'use strict';

// Example module use

var cdnjs = require('./cdn.js'),
    util = require('util');

cdnjs.libraries('knockout', ['keywords'], function (err, libraries) {
  console.log (util.inspect(arguments, { depth: null, colors: true }));
});

cdnjs.libraries(function (err, libraries) {
  cdnjs.search (libraries, 'knockout', function (err, results) {
    console.log('search:', util.inspect(results, {
      depth: null,
      colors: true
    }));
  });

  cdnjs.url(libraries, 'angular.js', function (err, result, version) {
    console.log('url:', util.inspect(result, {
      depth: null,
      colors: true
    }));
    console.log ('version:', version);
  });

  cdnjs.url(libraries, 'angular.js', '1.0.0', function (err, result, version) {
    console.log('versioned url:', util.inspect(result, {
      depth: null,
      colors: true
    }));
    console.log ('version:', version);
  });
});
