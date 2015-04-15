var log = require('npmlog')
  , fs = require('graceful-fs')
  , browserify = require('browserify')
  , less = require('less')
  , noLessTransform = require('./no-less-transform');

var Compiler = module.exports = {
  env: undefined,
  dirPath: undefined,
  bOptions: undefined,
  bCompiler: undefined,
  lOptions: undefined,

  init: function(dirPath, env){
    this.env = env || 'prod'; // ['dev', 'prod']
    this.dirPath = dirPath;
    this.setupBrowserify();
    this.setupLess();
  },

  setupBrowserify: function(){
    this.bOptions = {
      debug: (this.env === 'dev'),
      cache: {}, 
      packageCache: {}, 
      fullPaths: false,
    }
    this.bCompiler = browserify( this.dirPath + 'index.js', this.bOptions )
    this.bCompiler.transform(noLessTransform);
  },

  setupLess: function(){
    this.lOptions = { 
      sourceMap: {
        sourceMapFileInline: true
      } 
    };
  },

  compile: function(){
    this.compileJS();
    this.compileLess();
  },

  compileJS: function(fileName, isNewFile){
    log.info('compiler', 'compiling JS');
    var filePath = this.dirPath + (this.env === 'dev'? 'bundle.js' : 'bundle.min.js');
    var wStream = fs.createWriteStream( filePath, {encoding: 'utf8'} );
    var b = this.bCompiler.bundle();
    b.on('error', function(err){
      log.error('compiler', 'error compiling js: ', err);
    });
    b.pipe(wStream);
    wStream.on( 'close', log.info.bind(log, 'compiler',  'JS compiled successfully') )
  }, 

  compileLess: function(fileName, isNewFile){
    log.info('compiler', 'compiling CSS')
    var fileName = (this.env === 'dev')? 'bundle.css' : 'bundle.min.css';
    var css = '';
    var readStream = fs.createReadStream( this.dirPath + 'style.less', {encoding: 'utf8'} );
    var writeStream = fs.createWriteStream( this.dirPath + fileName );
    readStream.on('data', function(data){
        css += data;
    });
    readStream.on('close', function(){
      less.render(css, Compiler.lOptions )
        .then(function(output){ 
          fs.writeFile(Compiler.dirPath + fileName, output.css, function(err){
            if(err){
              return log.error('compiler','error writing file ' + fileName);
            }
            log.info('compiler', 'CSS compiled successfully');
          })
        });
    });
  }, 

  destroy: function(){
    this.env = null;
    this.dirPath = null;
    this.bOptions = null;
    this.bCompiler = null;
    this.lOptions = null;
  }
};


//[TODO] implement Caching for when whatching
// * when a file is changed, test if replacing the contents inside the bundle
//   is faster than compiling the whole thing
//   * this goes for browserify and less