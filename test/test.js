var cdnjs = require('../cdn.js'),
    should = require('should');

describe('packages', function () {

  it('should pull down all packages correctly', function (done) {
    cdnjs.packages(function (err, packages) {
      should.not.exist(err);
      packages.should.be.ok;
      packages.should.be.an.instanceOf(Array);
      done();
    });
  });

});

describe('search', function () {

  it('should find a known set of packages', function (done) {
    cdnjs.search('require', function (err, result) {
      should.not.exist(err);
      result.should.be.ok;
      result.should.be.an.instanceOf(Array);
      result.length.should.be.above(5)
      done();
    });
  });

});

describe('search', function () {

  it('should find a known url', function (done) {
    cdnjs.url('require.js', function (err, result) {
      should.not.exist(err);
      result.should.match(/\/\/cdnjs.cloudflare.com\/ajax\/libs\/require.js\/(.*)\/require.min.js/);
      done();
    });
  });

});