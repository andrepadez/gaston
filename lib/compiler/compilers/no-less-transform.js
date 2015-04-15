var fs = require('graceful-fs') 
  , p = require('path')
  , through = require('through2')
  , Promise = require('promise')
  , rEx = /require\(.+\.less\'\)/g
  , compiler;


module.exports = function(file){
  return through(function(buf, enc, next){
    var str = buf.toString('utf8');
    if( !str.match(rEx) ){
      this.push(str);
      return next();
    }

    if(!compiler){
      compiler = require('./');
    }

    var path = file.split(p.sep);
    path.pop();
    path = path.join(p.sep) + '/style.less';
    compiler.addLessFile(path);

    str = str.replace(rEx, '');
    this.push(str);
    next();
  });
};
