/* jshint node:true */

var Store = require('./db/store/store');
var route = require('./db/generate-route');

module.exports = function mountEndpoints(app, config) {
  app.store = new Store(config || {});

  // Log proxy requests
  var morgan  = require('morgan');
  app.use(morgan('dev'));

  app.store.namespaces.forEach(function(name) {
    route(app, name);
  });
};


