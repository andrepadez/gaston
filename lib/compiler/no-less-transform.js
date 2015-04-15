var fs = require('graceful-fs') 
  , p = require('path')
  , through = require('through2')
  , Promise = require('promise')
  , rEx = /require\(.+\.less\'\)/g
  , compiler;


module.exports = function(rootCompiler)
  return function(file){
    return through(function(buf, enc, next){
      var str = buf.toString('utf8');
      if( !str.match(rEx) ){
        this.push(str);
        return next();
      }

      var path = file.split(p.sep);
      path.pop();
      path = path.join(p.sep) + '/style.less';
      rootCompiler.addLessFile(path);

      str = str.replace(rEx, '');
      this.push(str);
      next();
    });
  };
};
