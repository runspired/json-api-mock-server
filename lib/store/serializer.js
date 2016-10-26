var assign = require('object-assign');
// var chalk = require('chalk');

function Serializer() {}

Serializer.prototype.maxSerializationDepth = 4;

Serializer.prototype.serializeRecord = function serializeRecord(record, query) {
  return this._serializeOne(record);
};

Serializer.prototype._serializeOne = function serializeOne(record, included, depth) {
  if (!depth && depth !== 0) {
    depth = 0;
  }

  var ret =  {};
  var seen = [];

  if (depth < this.maxSerializationDepth) {
    if (!included) {
      included = ret.included = [];
    }
  }

  ret.data = this._serializeRecord(record, included, ++depth, seen);

  return ret;
};

Serializer.prototype._serializeRecord = function(record, included, depth, seen) {
  if (seen.indexOf(record) !== -1) {
    throw new Error('Circular whoops!');
  }
  seen.push(record);
  var data = {
    id: record.id,
    type: record.type,
    attributes: assign({}, record.attributes)
  };

  if (record.relationships) {
    this._serializeIncludes(record, data, depth < this.maxSerializationDepth ? included : false, seen);
  }

  // console.log('serialized => ' + record.type + ':' + record.id);
  return data;
};

Serializer.prototype._serializeIncludes = function serializeIncludes(record, hash, included, seen) {
  var keys = Object.keys(record.relationships);
  var _serializer = this;

  if (keys.length) {
    hash.relationships = {};
  }

  keys.forEach(function(key) {
    var rel = record.relationships[key];

    if (rel) {
      // console.log('serializing relationship', key, rel.info());

      rel.fetch();

      hash.relationships[key] = { data: rel.info() };
      // console.log('serialized ' + key, hash.relationships[key], hash.type + '#' + hash.id);

      if (included) {
        if (rel instanceof Array) {
          // console.log('serializing many', rel.info(), rel.length, key);
          for (var i = 0; i < rel.length; i++) {
            if (seen.indexOf(rel[i]) === -1) {
              var v = _serializer._serializeRecord(rel[i], included, false, seen);
              // console.log('pushing include', v.type, v.id);
              included.push(v);
            }
          }
        } else {
          if (seen.indexOf(rel.value) === -1) {
            var v = _serializer._serializeRecord(rel.value, included, false, seen);
            // console.log('pushing include', v.type, v.id);
            included.push(v);
          }
        }
      }
    }
  });

};

Serializer.prototype.normalizeRecord = function normalizeRecord(record) {
  return this._normalizeOne(record);
};

Serializer.prototype.normalizeMany = function normalizeRecord(record) {
  throw new Error('whoops, this method was not implemented!');
};

Serializer.prototype._normalizeOne = function normalizeOne(record) {
  throw new Error('whoops, this method was not implemented!');
};

Serializer.prototype._stripIncludes = function _stripIncludes(ret, query) {
  var allowedIncludes = query && query.included ? query.included.split(',') : [];

  if (!allowedIncludes.length) {
    delete ret.included;
  } else {
    var finalIncludes = [];
    var seen = {};

    for (var i = 0, inc = ret.included, l = inc.length; i < l; i++) {
      var r = inc[i];
      seen[r.type] = seen[r.type]|| {};
      if (seen[r.type][r.id]) {
        continue;
      }
      seen[r.type][r.id] = true;

      if (allowedIncludes.indexOf(r.type) !== -1) {
        finalIncludes.push(r);
      }
    }
    ret.included = finalIncludes;
  }
};

Serializer.prototype.serializeMany = function serializeMany(records, query) {
  var _this = this;
  var ret = {
    data: [],
    included: []
  };

  records.forEach(function(record) {
    var serialized = _this._serializeOne(record);

    ret.data.push(serialized.data);
    ret.included = ret.included.concat(serialized.included);
  });

  this._stripIncludes(ret, query);

  return ret;
};

module.exports = Serializer;
