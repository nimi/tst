'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');

// Setup server
var app = express();
var server = require('http').createServer(app);
var path = require('path');

// Set appPath for dev environment
app.set('appPath', 'client');

// Set the port
app.set('port', process.env.PORT || 9000);

// All redirect to index.html
app.route('/*')
.get(function(req, res) {
  res.sendfile(app.get('appPath') + '/index.html');
});

// Start server
server.listen(app.get('port'), function () {
  //console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  console.log('Server listening on port 9000');
});

// Expose app
exports = module.exports = app;