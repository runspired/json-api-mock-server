/* jshint node:true */
var Serializer = require('./serializer');
var Namespace = require('./namespace');
var Attr = require('./factory/attr');
var One = require('./factory/one');
var Many = require('./factory/many');
var path = require('path');

function Store(config) {
  this.data = {};
  this.namespaces = [];

  var serializerPath = path.join(__dirname, '../serializers', config.serializer || '');

  this.serializer = config.serializer ? require(serializerPath) : new Serializer();
  this.config = config;

  // inject all the things
  Attr.prototype.store = this;
  One.prototype.store = this;
  Many.prototype.store = this;
  Namespace.prototype.store = this;

  // setup models
  var _store = this;
  var globSync = require('glob').sync;
  var models = globSync('../models/**/*.js', { cwd: __dirname });

  models.forEach(function(model) {
    var name = path.parse(model).name;

    _store.registerNamespace(name, require(model));
  });

  // seed
  var scPath = path.join(__dirname, '../scenarios', config.scenario || 'default');
  require(scPath)(this);
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
