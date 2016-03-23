var log = require('npmlog')
var fs = require('promfs')
var path = require('path')
var _ = require('lodash')
var Bundler = require('../../bundler')
var backtrackFile = require('../../utils/backtrack-file')

module.exports = function bundle (args) {
  var Config = global.Config
  var cwd = process.cwd()
  var source = args.s || args.source
  if (!source) {
    throw Error('you have to specify a source file')
  }
  if (source && source.indexOf('/') !== 0 && !~source.indexOf(cwd)) {
    source = path.join(cwd, source)
  }

  var pkgPath = backtrackFile('package.json', source)
  if (Config.gaston['base-path'] !== '/') {
    pkgPath = pkgPath.replace(Config.gaston['base-path'], '')
  }

  var output = args.o || args.output
  if (output && output.indexOf('/') !== 0 && !~output.indexOf(cwd)) {
    output = path.join(cwd, output)
  }

  var noMinimize = args.x || args.expanded

  var app

  return Config.registerProject(pkgPath, true)
    .then(function (project) {
      app = {
        title: project.pkg.name,
        project: project,
        source: source,
        noMinimize: noMinimize,
        gaston: _.merge({}, Config.gaston, project.pkg.gaston)
      }
      return app
    })
    .then(function (app) {
      var bundler = new Bundler(app)
      return bundler.build()
    })
    .then(function (bundle) {
      if (!output) {
        return exit(0)
      }

      var withIndex = args.i || args.index

      return fs.statAsync(output)
        .then(function (stat) {
          if (!stat.isDirectory()) {
            return exit(1, 'output must be a directory')
          }

          var promises = [
            fs.writeFileAsync(path.join(output, 'build.js'), bundle.js, 'utf8')
          ]

          if(bundle.css){
            promises.push(
              fs.writeFileAsync(path.join(output, 'build.css'), bundle.css, 'utf8')
            )
          }

          if (withIndex) {
            var indexPath = app.gaston['index-path']
            if (!indexPath) {
              indexPath = path.join(__dirname, '../../../', 'gaston-files', 'index.html')
            } else {
              if (!path.isAbsolute(indexPath)) {
                indexPath = path.join(app.project['base-path'], indexPath)
              }
            }
            var promise = fs.readFileAsync(indexPath, 'utf8')
              .then(function (data) {
                var target = path.join(output, 'build.html')
                data = data.replace('bundle.css', 'build.css')
                data = data.replace('bundle.js', 'build.js')
                return fs.writeFileAsync(target, data, 'utf8')
              })

            promises.push(promise)
          }

          return Promise.all(promises)
            .then(function () {
              exit(0)
            })
            .catch(function (err) {
              exit(1, err.message)
            })
        })
        .catch(function (err) {
          return exit(1, err.message)
        })
    })
}

var exit = function (code, message) {
  if (code) {
    return log.error('gaston', message)
  }
  log.info('gaston', 'build completed successfully')
  process.exit(code)
}
