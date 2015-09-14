var path = require('path')
  , _ = require('lodash')
  , browserify = require('browserify')
  , watchify = require('watchify')
  , Blessify = require('gaston-blessify')
  , smapify = require('smapify')
  , setAlias = require('./util/set-alias')

var bundle = module.exports = function bundle(){
  var options = this.options;
  var self = this;

  return new Promise(function(resolve, reject){
    var compiledFiles = [];

    var bOptions = {
      debug: options.sourceMaps,
      cache: {},
      packageCache: {},
      fullPaths: true,
      noParse: []
    };
    
    var b;
    if(options.gaston){
      var gastonPath = path.join(__dirname, '..', 'browser', 'gaston.js');
      b = browserify( gastonPath, bOptions );
      b.require( options.source, { expose: 'index.js' } );
      var testerPath = path.join(__dirname, '..', 'browser', 'tester.js');
      var dummyPath = path.join(__dirname, '..', 'browser', 'dummy-tester.js');
      if(options.testing){
        b.require( testerPath, { expose: 'gaston-tester' } );
      } else { 
        b.require( dummyPath, { expose: 'gaston-tester' } );
      }

      b.transform( require('./transforms/gaston-browser') );
    } else {
      b = browserify( options.source, bOptions );
    }

    var blessify = new Blessify(options);
    b.transform( blessify.transform, { global: true } );
    b.transform( require('./transforms/ignores') );

    var pkgPath = options.package || path.join(__dirname, '..', 'browser', 'dummy.json');
    b.require( pkgPath , { expose: 'package.json' } );

    self.watchify = watchify(b);

    var bundle;
    var onBundleComplete = function onBundleComplete(err, buf){
      if(err){
        return reject(err);
      }

      var jsCode = buf.toString();

      blessify.render()
        .then(function(output){
          resolve({
            js: jsCode,
            css: output.css,
            smaps: smapify.smaps,
            files: compiledFiles
          });
        });
    }

    bundle = self.watchify.bundle( onBundleComplete );
    bundle.on('data', smapify.buildMaps);

    b.on('file', function(file){
      compiledFiles.push(file);
    });
  });
};