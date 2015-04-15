var fs = require('graceful-fs')
  , path = require('path')
  , log = require('npmlog')
  , compiler = require('../compiler')
  , fsWatcher;

var Watcher = module.exports = function(initialPath){
  return function(req, res, next){
    if( ~req.url.indexOf('bundle') ){
      return next();
    }
    var fullPath = initialPath + req.url
      , isDirectory = fs.statSync(fullPath).isDirectory();

    if( !isDirectory ){
      var ext = req.url.split('.').pop();
      if(ext === 'html'){
        if(fsWatcher){
          return next();
        }
        var dirPath = req.url.substr(0, req.url.lastIndexOf('/'))+'/';
        var watchPath = initialPath + dirPath;
        compiler.init(watchPath, 'dev');
        fsWatcher = fs.watch(watchPath, {
          recursive: true
        }, watcherHandler.bind( null, initialPath + dirPath ) );
        compiler.compile();
      }
    } else {
      if(fsWatcher){ 
        fsWatcher.close();
        fsWatcher = null;
        compiler.destroy();
      }
    }

    next();

  };
}

var watcherHandler = function(dirPath, ev, fileName){
  if( ~fileName.indexOf('bundle') ){
    return;
  }
  log.info('watcher', fileName, 'has changed');
  var isNewFile = ev === 'rename';
  switch( path.extname(fileName) ){
    case '.js':
      compiler.compileJS(fileName, isNewFile);
      break;
    case '.less':
      compiler.compileLess(fileName, isNewFile);
      break; 
  }
}