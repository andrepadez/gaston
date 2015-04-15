var log = require('npmlog')
  , Promise = require('promise')
  , less = require('less')
  , RootCompiler

var Compiler = module.exports = {
  options: undefined,

  setup: function(rootCompiler){
    RootCompiler = rootCompiler;
    Compiler.options = { 
      sourceMap: {
        sourceMapFileInline: true
      } 
    };
  },

  compile: function(lessToRender){
    return new Promise(function(fulfill, reject){
      log.info('Less Compiler', 'compiling CSS')
      //Compile the whole less
      less.render(lessToRender)
        .then(function(output){
            fulfill(output);
          });
    });
  }, 

  destroy: function(){
    RootCompiler = null;
    this.options = null;
  }

};