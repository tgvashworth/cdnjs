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

  it('should cache packages', function (done) {
    cdnjs.packages(function (err, packages) {
      should.not.exist(err);
      packages.should.be.ok;
      packages.should.be.an.instanceOf(Array);
      cdnjs.cache.packages.should.be.ok.and.be.an.instanceOf(Array);
      cdnjs.packages(function (err, cachePackages, hitCache) {
        hitCache.should.be.ok;
        done();
      });
    });
  });

});

describe('search', function () {

  it('should find a known set of packages', function (done) {
    cdnjs.search('jquery', function (err, result) {
      should.not.exist(err);
      result.should.be.ok;
      result.should.be.an.instanceOf(Array);
      result.length.should.be.above(20);
      done();
    });
  });

  it('should find a known url', function (done) {
    cdnjs.url('require.js', function (err, result) {
      should.not.exist(err);
      result.name.should.equal('require');
      result.url.should.match(/\/\/cdnjs.cloudflare.com\/ajax\/libs\/require.js\/(.*)\/require.min.js/);
      done();
    });
  });

});

describe('url', function () {

  it('should find a url for a known package', function (done) {
    cdnjs.url('angular.js', function (err, result) {
      should.not.exist(err);
      result.should.be.ok;
      result.name.should.equal('angular');
      done();
    });
  });

  it('should find a url for a known package with ".js" added to the name', function (done) {
    cdnjs.url('jquery.js', function (err, result) {
      should.not.exist(err);
      result.should.be.ok;
      result.name.should.equal('jquery');
      done();
    });
  });

  it('should find a url for a known package with ".js" missing from the name', function (done) {
    cdnjs.url('require', function (err, result) {
      should.not.exist(err);
      result.name.should.equal('require');
      result.url.should.match(/\/\/cdnjs.cloudflare.com\/ajax\/libs\/require.js\/(.*)\/require.min.js/);
      done();
    });
  });

  it('should find a versioned url for a known package', function (done) {
    cdnjs.url('angular.js@1.0.0', function (err, result) {
      should.not.exist(err);
      result.should.be.ok;
      result.name.should.equal('angular@1.0.0');
      result.url.should.include('1.0.0');
      done();
    });
  });

});