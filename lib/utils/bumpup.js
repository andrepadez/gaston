var log = require('npmlog')
  , fs = require('vigour-fs-promised')
  , path = require('path')
  , Promise = require('bluebird')
  , nodegit = require('nodegit')
  , repo = require('./repo')
  , repo = require('./repo')
  , rEx = /\"version\"\: \"(\d+\.\d+\.\d+)\"/
  , bumps = ['major', 'minor', 'revision'];

module.exports = function(pkgPath, bump){
  
  pkgPath = pkgPath || path.join(process.cwd(), 'package.json');
  bump = bump || 'revision';
  if( bumps.indexOf(bump) === -1 ){
    reject(new Error('Incorrect bump type - use major, minor or revision'));
  };
  var pkgData, bumpedVersion;
  return fs.readFileAsync(pkgPath, 'utf8')
    .then(function(data){
        pkgData = data;
        var match = pkgData.match(rEx);
        return match[1];
      })
      .then( getCommitedVersion )
      .then(function(versions){ 
        if(versions.commited !== versions.current){
          log.info('bumpup', 'version will be bumped after commit. Current: ' + versions.current + '. Commited: ' + versions.commited);
          return versions.current;
        }
        bumpedVersion = bumpVersion(versions.current, bump);
        var newData = pkgData.replace(rEx, '"version": "' + bumpedVersion + '"');
        return fs.writeFileAsync(pkgPath, newData);
      })
      .then(function(version){
        if(bumpedVersion){
          log.info('bumpup', 'bumped up version to ', bumpedVersion);
        }
        return bumpedVersion || version;
      })
      .catch(function(err){
        log.error('bumpup', err);
      });
};

var bumpVersion = function(currentVersion, bump){
  currentVersion = currentVersion.split('.'); 
      switch(bump){
        case 'revision':
          currentVersion[2] = parseInt(currentVersion[2], 10) + 1;
          break;
        case 'minor':
          currentVersion[1] = parseInt(currentVersion[1], 10) + 1;
          currentVersion[2] = 0;
          break;
        case 'major':
          currentVersion[0] = parseInt(currentVersion[0], 10) + 1;
          currentVersion[1] = 0;
          currentVersion[2] = 0;
          break;
      }
      
      return currentVersion.join('.');
}

var getCommitedVersion = function(initialVersion){
  return repo.getFileAtCommit('package.json', 'HEAD')
    .then(function(pkg){
      var match = pkg.match(rEx);
      var commitedVersion = match[1];
      return({
        current: initialVersion,
        commited: commitedVersion
      });
    })
    .catch(function(err){
      log.error(err);
    });
};
