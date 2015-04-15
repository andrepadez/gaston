var fs = require('graceful-fs') 
 , through = require('through2')
  , rEx = /require\(.+\.less\'\)/g
  , requiredLess


module.exports = function(file){
  return through(function(buf, enc, next){
    var str = buf.toString('utf8');
    if(!str.match(rEx)){
      return next();
    }
    str = str.replace(rEx, '');
    this.push(str);
    next();
  });
};