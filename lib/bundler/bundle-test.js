var fs = require('vigour-fs-promised')
var path = require('path')
var browserify = require('browserify')
var watchify = require('watchify')
var Babelify = require('./transforms/babelify')
var glob = require('glob')
var Blessify = require('gaston-blessify')
var Aliasify = require('gaston-aliasify')
var Smapify = require('gaston-smapify')
var applyTransforms = require('./util/apply-transforms')
var tmpdir = require('os').tmpdir()

module.exports = function bundleTest (runGaston) {
  // var Config = global.Config
  var self = this
  var app = self.app || {}
  app.gaston = app.gaston || {}
  var project = app.project

  if (self.watchify) {
    return new Promise(function (resolve, reject) {
      var onComplete = onBundleComplete(self.blessify, resolve, reject, self)
      var bundle = self.watchify.bundle(onComplete)
      bundle.on('data', self.smapify.buildMap)
    })
  }

  return new Promise(function (resolve, reject) {
    var bOptions = {
      debug: app.gaston['source-maps'],
      cache: {},
      packageCache: {},
      fullPaths: true,
      noParse: []
    }

    var b

    if (runGaston) {
      var gastonPath = path.join(__dirname, '..', 'browser', 'index.js')
      b = browserify(gastonPath, bOptions)
      b.add(app.source)
      b.require(path.join(__dirname, 'dummys', 'index.js'), { expose: 'index.js' })
      var dummyPath = path.join(__dirname, 'dummys/tester.js')
      b.transform(require('./transforms/gaston-browser'))
    } else {
      b = browserify(app.source, bOptions)
    }

    var testerPath = path.join(__dirname, '..', 'tester', 'browser.js')
    b.require(testerPath, { expose: 'gaston-tester' })
    applyTransforms(b, app)

    var babelify = Babelify(app)
    if (!app.gaston.es5) {
      b.transform(babelify)
    }
    var blessify = self.blessify = new Blessify(app)
    b.transform(blessify.transform, { global: true })

    var aliasify = new Aliasify(app)
    b.transform(aliasify.transform)

    var pkgPath
    if (app.gaston.package) {
      console.log('package.json', path.join('/', project['base-path'], 'package.json'))
      pkgPath = path.join('/', project['base-path'], 'package.json')
    } else {
      pkgPath = path.join(__dirname, 'dummys', 'package.json')
    }
    b.require(pkgPath, { expose: 'package.json' })

    self.watchify = watchify(b)

    var onComplete = onBundleComplete(blessify, resolve, reject, self)
    var bundle = self.watchify.bundle(onComplete)
    self.smapify = new Smapify(app)
    bundle.on('data', self.smapify.buildMap)
  })
}

var onBundleComplete = function (blessify, resolve, reject, bundler) {
  return function onBundleComplete (err, buf) {
    if (err) {
      bundler.watchify = null
      return reject(err)
    }

    var jsCode = buf.toString()

    blessify.render()
      .then(function (output) {
        resolve({
          js: jsCode,
          css: output.css,
          smaps: bundler.smapify.map,
          files: bundler.smapify.files
        })

        bundler.smapify.clear()
      })
      .catch(function (err) {
        bundler.watchify = null
        reject({
          originalCode: blessify.originalCode,
          lessCode: blessify.lessCode,
          error: err
        })
        blessify.clear()
      })
  }
}
