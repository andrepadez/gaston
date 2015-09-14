var package = require('package.json')
  , ui = require('./gaston-ui')
  , performance = require('../performance')
  , log = require('./log')
  ;

var gaston = window.gaston = module.exports = {
  server: {
    ip: '{{gaston.ip}}',
    port: '{{gaston.port}}',
    socket: '{{gaston.socket}}'
  },
  log: log,
  remoteLogging: package.gaston && package.gaston['remote-logging'],
  serverAddress: '',
  socket: undefined,
  clientId: undefined,
  inited: false,
  connected: false,

  performance: performance,

  init: function(){
    if(this.inited){
      return false;
    }
    if(!!window.mocha){
      require('gaston-tester')
    }
    this.inited = true;

    //gets or initializes the config
    this.config = (localStorage.getItem('gaston') && JSON.parse( localStorage.getItem('gaston') ) ) || {};

    //if remote server, relaunch the page loading js from remote server
    if( this.config.remote && this.config.server ){
      if(!this.config.launched){
        gaston.set('launched', true);
        var server = this.config.server;
        var script = document.createElement('script');
        var buster = Math.floor(Math.random() * 999999);
        script.src = 'http://' + server.ip + ':' + server.port + '/bundle.js?' + buster;
        document.head.appendChild(script);
        return;
      }
    }
    gaston.unset('launched');

    require('./connect');
    gaston.connect();


    if( !gaston.remoteLogging){
      gaston.run();
    }

  },

  run: runApplication,

  on: function(ev, handler){
    if(!gaston.socket){
      return;
    }
    // console.log('ho ho ho', ev)
    gaston.socket.on(ev, handler);
  },

  emit: function(message, payload){
    gaston.socket.emit(message, payload);
  },

  set: function(key, value){
    this.config[key] = value;
    localStorage.setItem('gaston', JSON.stringify(this.config) );
  },

  unset: function(key){
    if( Array.isArray( this.config[key] ) ){
      gaston.config[key] = [];
    } else {
      delete gaston.config[key];
    }
    localStorage.setItem('gaston', JSON.stringify(gaston.config) );
  },

  get: function(key){
    return this[key];
  },

  reset: function(){
    localStorage.setItem( 'gaston', JSON.stringify({}) );
  },

  remote: function(server){
    if(server){
      gaston.set('server', server);
      gaston.set('remote', true);
    } else {
      gaston.set('remote', !gaston.config.remote);
    }
  },
  identify: function(action, file){
    var ua = require('./user-agent');
    gaston.set('ua', ua);
    var rex = /GastonID=(\w+-\w+-\w+-\d+)/;
    var search = window.location.search;
    var match = rex.exec(window.location.search);
    if(!match){
      var ua = gaston.config.ua;
      id = ua.platform + '-' + ua.device + '-' + ua.browser;
      id += '-' +  Math.floor(Math.random()* 999);
      gaston.set('$id', id);

      var queryString = (search.length === 0? '?' : '&') + 'GastonID=' + gaston.config.$id;
      queryString += '&file=' + (file || 'index.js');
      queryString += '&action=' + action;

      window.location.href = window.location.href + queryString;
    } else {
      gaston.id = match[1];
    }
  },
  stop: function(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'stop-running');
    xhr.onload = function(){
      if(this.status === 200){
        var href = window.location.href.replace(/\?.+$/, '');
        window.location.href = href;
      }
    };
    xhr.send();
  }
};



Object.defineProperty(gaston, 'id', {
  set:function(val) {
    this._id = val;
    this.socket.emit('id', val);
  },
  get:function() {
    return this._id;
  }
});

gaston.init();


function runApplication(){

  if(gaston.remoteLogging){
    require('./take-over-console');
  }

  gaston.config.ua = gaston.config.ua || {
    device: 'desktop'
  };

  if(gaston.config.ua.device !== 'desktop'){
    require('./gaston-ui').init();
  }

  try {
    require('index.js');
  } catch(err){
    if(window.oldConsole){
      oldConsole.error(err);
    } else {
      console.error(err.stack);
    }
  }
}

