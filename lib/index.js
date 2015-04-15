
var server = require('./server');

var Gaston = module.exports = {
  compiler: require('./compiler'),
  utils: require('./utils'),
  start: function(){
    server.start.apply(server, arguments);
  }
};