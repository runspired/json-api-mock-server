/* jshint node:true */
var Serializer = require('./serializer');
var Namespace = require('./namespace');
var Attr = require('./factory/attr');
var One = require('./factory/one');
var Many = require('./factory/many');
var path = require('path');
var chalk = require('chalk');

function softAssert(message, test) {
  if (!test) {
    console.log(
      chalk.bgRed(chalk.white(chalk.bold(' Error '))) +
        chalk.white(' JSON-API-MOCK-SERVER ') +
        chalk.yellow(message)
    );

    let trace = new Error(message);
    console.log('\n\n', chalk.red(trace));
  }
}

function warn(message, test) {
  if (!test) {
    console.log(
      chalk.bgYellow(chalk.white(chalk.bold(' Warning '))) +
      chalk.white(' JSON-API-MOCK-SERVER ') +
      chalk.yellow(message)
    );
  }
}

function normalizeConfig(config) {
  if (!config.logApiRequests && config.logApiRequests !== false) {
    config.logApiRequests = true;
  }
  if (!config.logApiResponses && config.logApiResponses !== false) {
    config.logApiResponses = true;
  }

  return config;
}

function Store(config) {
  this.data = {};
  this.namespaces = [];
  this._config = normalizeConfig(config);
  this._models = {};
  this._scenarios = {};
  this._serializers = {};
  this.apiNamespace = config.apiNamespace || 'api';

  // inject all the things
  Attr.prototype.store = this;
  One.prototype.store = this;
  Many.prototype.store = this;
  Namespace.prototype.store = this;

  var _store = this;
  var serializers = config._defs.serializers;
  // setup serializer
  if (serializers.length) {
    serializers.forEach(function(serializer) {
      var name = path.parse(serializer).name;
      _store._serializers[name] = serializer;
    });
  }

  if (config.serializer) {
    softAssert("You specified a serializer in your config but no serializers were found.", serializers.length);
    var serializerPath = this._serializers[config.serializer];

    softAssert("You specified a serializer in your config but that serializer was not found.", serializerPath);
    var UserSerializer = require(serializerPath);
    this.serializer = new UserSerializer();
  } else {
    this.serializer = new Serializer();
  }

  // setup models
  var models = config._defs.models;
  warn("Cannot mount endpoints, you have no models.", models.length);
  models.forEach(function(model) {
    var name = path.parse(model).name;
    _store._models[name] = model;

    _store.registerNamespace(name, require(model));
  });

  // setup scenarios
  var scenarios = config._defs.scenarios;
  scenarios.forEach(function(scenario) {
    var name = path.parse(scenario).name;
    _store._scenarios[name] = scenario;
  });

  // seed
  var scenario;
  if (config.scenario) {
    scenario = this._scenarios[config.scenario];
    if (models.length) {
      softAssert("You specified a scenario but it was not found.", scenario);
    } else {
      warn("You specified a scenario but it was not found.", scenario);
    }
  } else {
    scenario = this._scenarios['default'];
    if (models.length) {
      softAssert("You failed to specify a scenario and there is no default scenario to fallback to.", scenario);
    } else {
      warn("You failed to specify a scenario and there is no default scenario to fallback to.", scenario);
    }
  }

  if (scenario) {
    var scPath = path.join(scenario);
    require(scPath)(this);
  }
}

Store.prototype.registerNamespace = function registerNamespace(namespace, model) {
  this.namespaces.push(namespace);
  this.data[namespace] = new Namespace(namespace, model, this.serializer);
};

Store.prototype.namespaceFor = function namespaceFor(namespace) {
  return this.data[namespace];
};

Store.prototype.findRecord = function findRecord(namespace, id) {
  return this.namespaceFor(namespace).findRecord(id);
};

Store.prototype.createRecord = function createRecord(namespace, data) {
  return this.namespaceFor(namespace).createRecord(data);
};

Store.prototype.findAll = function findAll(namespace) {
  return this.namespaceFor(namespace).findAll();
};

Store.prototype.query = function query(namespace, query) {
  return this.namespaceFor(namespace).query(query);
};

Store.prototype.deleteRecord = function deleteRecord(namespace, id) {
  this.namespaceFor(namespace).deleteRecord(id);
};

Store.prototype.updateRecord = function updateRecord(namespace, id, data) {
  this.namespaceFor(namespace).updateRecord(id, data);
};

Store.prototype.seed = function seed(namespace, number) {
  return this.namespaceFor(namespace).seed(number);
};

module.exports = Store;
