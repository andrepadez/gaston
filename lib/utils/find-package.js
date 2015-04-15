var fs = require('graceful-fs')
  , log = require('npmlog');

module.exports.findPackage = function(origPath){
  var count = 0
    , package;
  function walk(path){
    var exists = fs.existsSync(path+'/package.json');
    if(exists){
      return require(path+'/package.json');
    } else {
      if(count++ < 10){
        return walk(path + '/..');
      } else {
        log.error('cannot find package.json tried 10 directories up')
      }
    }
  }
  return walk( origPath );
}