var log = require('npmlog')
  , fs = require('graceful-fs')
  , Promise = require('promise')
  , browserify = require('browserify')
  , noLessTransform = require('./no-less-transform')
  , RootCompiler;

var Compiler = module.exports = {
  options: undefined,
  bundler: undefined,
  setup: function(rootCompiler){
    RootCompiler = rootCompiler;
    this.options = {
      debug: (this.env === 'dev'),
      cache: {}, 
      packageCache: {}, 
      fullPaths: false,
    }
    this.bundler = browserify( this.dirPath + 'index.js', this.bOptions )
    this.bundler.transform(noLessTransform);
  },

  compile: function(){
    return new Promise(function(fulfill, reject){
      log.info('compiler', 'compiling JS');

      var jsPath = RootCompiler.dirPath 
        + (RootCompiler.env === 'dev'? 'bundle.js' : 'bundle.min.js');

      var wStream = fs.createWriteStream( jsPath, {encoding: 'utf8'} );
      var b = Compiler.bundler.bundle();
      b.on('error', function(err){
        log.error('compiler', err.message);
        reject(err);
      });
      b.pipe(wStream);
console.log('attaching')
      wStream.on( 'close', function(){
        log.info('compiler',  'JS compiled successfully');
        fulfill();
      });
    });
  }, 

  destroy: function(){
    this.options = null;
    this.bundler = null;
  }

};