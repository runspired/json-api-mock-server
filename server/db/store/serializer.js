var Validator = require('jsonapi-validator').Validator;
var Schema = require('./schema.json');
var validator = new Validator(Schema);
var assign = require('object-assign');
var chalk = require('chalk');

function validateJsonApi(json) {
  // will throw error if our payloads are wrong
  try {
    validator.validate(json);
  } catch (e) {
    console.log(chalk.red('Invalid json-api response detected'));
    console.log('original payload');
    console.log(chalk.grey(JSON.stringify(json, null, 2)));
    console.log(chalk.yellow('\n\nJSON API VALIDATION ERRORS' +
      '\n===========================\n'));

    for (let i = 0; i < e.errors.length; i++) {
      console.log('\t' + (i + 1) + ')\t'
        + stringifyValidationError(e.errors[i]));
    }
    console.log('\n');
  }

  return json;
}

function stringifyValidationError(e) {
  return chalk.cyan(e.keyword) + ' ' + chalk.white(e.message);
}

function Serializer() {}

Serializer.prototype.maxSerializationDepth = 4;

Serializer.prototype.serializeOne = function serializeOne(record, included, depth) {
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

  return ret; // validateJsonApi(ret);
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
    this.serializeIncludes(record, data, depth < this.maxSerializationDepth ? included : false, seen);
  }

  // console.log('serialized => ' + record.type + ':' + record.id);
  return data;
};

Serializer.prototype.serializeIncludes = function serializeIncludes(record, hash, included, seen) {
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

Serializer.prototype.normalizeOne = function normalizeOne(record) {
  throw new Error('whoops, needs work');
  var values = record.data && record.data.attributes ? record.data.attributes : {};

  delete values.id;

  return values;
};

Serializer.prototype.serializeMany = function serializeMany(records) {
  var _this = this;
  var ret = {
    data: [],
    included: []
  };

  records.forEach(function(record) {
    var serialized = _this.serializeOne(record);

    ret.data.push(serialized.data);
    ret.included = ret.included.concat(serialized.included);
  });

  return validateJsonApi(ret);
};

module.exports = Serializer;
