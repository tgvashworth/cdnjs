// Example module use

var cdnjs = require('./'),
    util = require('util');

cdnjs.search('angular', function (err, packages) {
  console.log('search:', util.inspect(packages, {
    depth: null,
    colors: true
  }));
});

cdnjs.url('angular.js', function (err, packages) {
  console.log('url:', util.inspect(packages, {
    depth: null,
    colors: true
  }));
});

cdnjs.url('angular.js@1.0.0', function (err, packages) {
  console.log('versioned url:', util.inspect(packages, {
    depth: null,
    colors: true
  }));
});
