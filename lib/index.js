/* jshint node:true */

var Store = require('./store/store');
var route = require('./generate-route');
var globSync = require('glob').sync;
var path = require('path');

module.exports = function mountEndpoints(app, config) {
  var dirPrefix = path.resolve('./server');
  var scenarios = globSync(path.join(dirPrefix, './scenarios/**/*.js'));
  var models = globSync(path.join(dirPrefix, './models/**/*.js'));
  var serializers = globSync(path.join(dirPrefix, './serializers/**/*.js'));

  config = config || {};
  config._defs = {
    scenarios: scenarios,
    models: models,
    serializers: serializers
  };

  app.store = new Store(config || {});
  app.store.namespaces.forEach(function(name) {
    route(app, name);
  });
};


