var cdnjs = require('../cdn.js'),
    should = require('should');

describe('packages', function () {

  it('should pull down all packages correctly', function (done) {
    this.timeout(5000);
    cdnjs.packages(function (err, packages) {
      should.not.exist(err);
      packages.should.be.ok;
      packages.should.be.an.instanceOf(Array);
      done();
    });
  });

  it('should cache packages', function (done) {
    this.timeout(5000);
    cdnjs.packages(function (err, packages) {
      should.not.exist(err);
      packages.should.be.ok;
      packages.should.be.an.instanceOf(Array);
      cdnjs.cache.should.be.ok;
      cdnjs.cache.packages.should.be.an.instanceOf(Array);
      cdnjs.packages(function (err, cachePackages, hitCache) {
        hitCache.should.be.ok;
        done();
      });
    });
  });

});

describe('search', function () {

  it('should find a known set of packages', function (done) {
    this.timeout(5000);
    cdnjs.search('require', function (err, result) {
      should.not.exist(err);
      result.should.be.ok;
      result.should.be.an.instanceOf(Array);
      result.length.should.be.above(5);
      done();
    });
  });

  it('should find a known url', function (done) {
    this.timeout(5000);
    cdnjs.url('require.js', function (err, result) {
      should.not.exist(err);
      result.name.should.equal('require.js');
      result.url.should.match(/\/\/cdnjs.cloudflare.com\/ajax\/libs\/require.js\/(.*)\/require.min.js/);
      done();
    });
  });

});