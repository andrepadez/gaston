var log = require('npmlog')
  , fs = require('graceful-fs')
  , lessCompiler = require('./compilers/less')
  , browserifyCompiler = require('./compilers/browserify')

var Compiler = module.exports = {
  env: undefined,
  dirPath: undefined,
  lessToRender: '',

  setup: function(options){
    this.env = options.env || 'prod'; // ['dev', 'prod']
    this.dirPath = options.path;
    this.jsCompiler = require( './compilers/' 
      + (options.jsCompiler || 'browserify') );
    this.cssCompiler = require( './compilers/' 
      + (options.cssCompiler || 'less') );
    this.jsCompiler.setup(this);
    this.cssCompiler.setup(this);
  },

  compile: function(){
    return this.jsCompiler.compile( this )
      .then( this.cssCompiler.compile.bind( this ) )
      .then(
        function(output){ console.log('path', Compiler.dirPath)
          var cssPath = Compiler.dirPath 
            + (Compiler.env === 'dev'? 'bundle.css' : 'bundle.min.css');
          fs.writeFile(cssPath, output.css, 'utf8', function(err){
            if(err){ return log.err('compiler', err); }
            log.info('compiler', 'Less compiled successfully', output.css.length);
          });
        }
      );
    
  },

  addLessFile: function(path){
    fs.readFile(path, 'utf8', function(err, data){
      Compiler.lessToRender += '/* ['+path+'] */\n';
      Compiler.lessToRender += data + '\n';
    });
  },

  destroy: function(){
    this.env = null;
    this.dirPath = null;
    this.jsCompiler.destroy();
    this.cssCompiler.destroy();
  }
};


//[TODO] implement Caching for when whatching
// * when a file is changed, test if replacing the contents inside the bundle
//   is faster than compiling the whole thing
//   * this goes for browserify and less