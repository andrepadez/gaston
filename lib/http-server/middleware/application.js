var fs = require('promfs')
var path = require('path')
var _ = require('lodash')
var url = require('url')
var Bundler = require('../../bundler')
var Watcher = require('../watcher')
var errorHandler = require('./error-handler')
var replacer = require('../../utils/replacer')
var gastonFilesPath = path.join(__dirname, '../../..', 'gaston-files')
var gastonIndexPath = path.join(gastonFilesPath, 'index.html')

module.exports = function (project) {
  return function (req, res, next) {
    var Config = global.Config
    var headers = req.headers

    var parsedUrl = url.parse(req.url, true)
    var query = parsedUrl.query

    if (query.$action !== 'dev') {
      return next()
    }

    var appName = headers.host + query.$file

    var app = Config.apps[appName]
    if (!app) {
      var fileToCompile = path.join(project['base-path'], query.$file)
      app = Config.apps[appName] = {
        title: project.pkg.name,
        name: appName,
        project: project,
        source: fileToCompile,
        gaston: _.merge({}, Config.gaston, project.pkg.gaston)
      }
      app.bundler = new Bundler(app)
    }

    app.bundler.bundle(true)
      .then(function (bundle) {
        app.bundle = bundle
        Watcher.updateApp(app)
        return getIndexHTML(app)
      })
      .then(function (app) {
        return app.indexStream.pipe(res)
      })
      .catch(function (err) {
        app.res = res
        errorHandler(err, app)
      })
  }
}

var getIndexHTML = function (app) {
  var indexPath = gastonIndexPath
  if (app.gaston['index-path']) {
    indexPath = app.gaston['index-path']
    if (!path.isAbsolute(indexPath)) {
      indexPath = path.join(app.project['base-path'], indexPath)
    }
  }

  // app.title = app.basePath.substr(app.basePath.length - 15)
  app.indexStream = fs.createReadStream(indexPath)
    .pipe(replacer({
      title: app.title + '-' + app.name,
      '$bundle.css': 'bundle.css?$app=' + app.name,
      '$bundle.js': 'bundle.js?$app=' + app.name
    }))
  return app
}
