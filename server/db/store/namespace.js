var Factory = require('./factory');

function Namespace(name, model, serializer) {
  this._recordMap = {};
  this._records = [];
  this._nextID = 0;
  this._schema = model;
  this.serializer = serializer;
  this.factory = new Factory(name, model, this.store, this);
  this._name = name;
  this._type = name;
}

Namespace.prototype.clone = function clone(records) {
  return records.map(function(record) {
    return assign({}, record);
  });
};

Namespace.prototype.findRecord = function findRecord(id) {
  var record = this._recordMap[id];

  if (!record || record.__deleted) {
    throw new Error(404);
  }

  return this.serializer.serializeOne(record);
};

Namespace.prototype.createRecord = function createRecord(data) {
  var record = {};

  if (!data) {
    throw new Error(500);
  }

  var values = this.serializer.normalizeOne(data);

  assign(record, this._schema(), values, { id: this._nextID++ });
  this._records.push(record);
  this._recordMap[record.id] = record;

  return this.serializer.serializeOne(record);
};

Namespace.prototype.findAll = function findAll() {
  return this.serializer.serializeMany(this._records.filter(function(record) {
    return !record.__deleted;
  }));
};

Namespace.prototype.query = function query(query) {
  var records = this._records.filter(function(record) {
    return !record.__deleted;
  });

  var page = parseInt(query.page, 10);
  var limit = parseInt(query.limit, 10);
  var startingIndex = page * limit;
  var results = records.slice(startingIndex, startingIndex + limit);

  return this.serializer.serializeMany(results);
};

Namespace.prototype.deleteRecord = function deleteRecord(id) {
  var record = this._recordMap[id];

  if (!record || record.__deleted) {
    throw new Error(500);
  }

  record.__deleted = true;
};

Namespace.prototype.updateRecord = function updateRecord(id, data) {
  var record = this._recordMap[id];

  if (!data || !record || record.__deleted) {
    throw new Error(500);
  }

  var values = this.serializer.normalizeOne(data);

  assign(record, values);

  return this.serializer.serializeOne(record);
};

Namespace.prototype.pushRecord = function pushRecord(record) {
  this._recordMap[record.id] = record;
  this._records.push(record);
};

Namespace.prototype.findReference = function findReference(id) {
  var record = this._recordMap[id];

  if (!record) {
    record = this.seed(1, { id: id })[0];
  }

  // console.log('Reference#' + this._type + ':' +  id, record);

  return record;
};

Namespace.prototype.seed = function seed(number, options) {
  options = options || {};
  var records = [];

  for (var i = 0; i < number; i++) {
    records.push(this.factory.generate(options));
  }

  return records;
};

module.exports = Namespace;
