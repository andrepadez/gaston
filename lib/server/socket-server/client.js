var newId = require('../../utils/id')
  , Server;

var Client = module.exports = function(socket){
  Server = Server || require('./');
  this.socket = socket;
  this.id = newId('gaston-client-');

  this.socket.on('disconnect', this.destroy.bind(this) );

  this.socket.emit('authenticated', {
    id: this.id
  });
};

Client.prototype.destroy = function(){
  Server.removeClient(this.id);
};
