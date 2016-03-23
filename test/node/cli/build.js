var os = require('os')
var fs = require('promfs')
var path = require('path')
var exec = require('child_process').exec
var tmpdir = path.join(os.tmpdir(), 'gaston-tests')

describe('CLI - gaston build', function(){
  this.timeout(20000)

  before(function(done){
    fs.removeAsync(tmpdir)
      .then(() => fs.mkdirp(tmpdir))
      .then(() => done())
  })

  it('should build without errors', function(done){
    var cmd = './bin/gaston build -s ./test/sample-app/src/index.js -i -o ' + tmpdir
    exec(cmd, function(err){
      assert.isNull(err)
      done()
    })
  })

  it('should create build.js', function(done){
    var pathToTest = path.join(tmpdir, 'build.js')
    fs.existsAsync(pathToTest).then(function(exists){
      assert.ok(exists)
      done()
    })
  })

  it('should create build.css', function(done){
    var pathToTest = path.join(tmpdir, 'build.css')
    fs.existsAsync(pathToTest).then(function(exists){
      assert.ok(exists)
      done()
    })
  })

  it('should create build.html', function(done){
    var pathToTest = path.join(tmpdir, 'build.html')
    fs.existsAsync(pathToTest).then(function(exists){
      assert.ok(exists)
      done()
    })
  })

  describe('build.html should reference the correct files', function(){
    var data
    before(function(done){
      var pathToTest = path.join(tmpdir, 'build.html')
      fs.readFileAsync(pathToTest, 'utf8')
        .then(function(d){
          data = d
          done()
        })
    })

    it('should have script tag to build.js', function(){
      assert.ok(~data.indexOf('src="build.js"'))
    })

    it('should have link tag to build.css', function(){
      assert.ok(~data.indexOf('href="build.css"'))
    })
  })

})
