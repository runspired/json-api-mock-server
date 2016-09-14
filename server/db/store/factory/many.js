function Many(type, options) {
  this.type = type;
  this.options = options;
}

function RecordArray() {
  var arr = [];
  arr.push.apply(arr, arguments);
  arr.__proto__ = RecordArray.prototype;
  return arr;
}
RecordArray.prototype = new Array();
RecordArray.prototype.relationship = null;
RecordArray.prototype.namespace = null;

RecordArray.prototype.fetch = function fetch() {
  for (var i = 0; i < this.length; i++) {
    this[i] = typeof this[i] === 'string' ? this.namespace.findReference(this[i]) : this[i];

    // self clean
    if (!this[i] || this[i].__deleted) {
      this.splice(i, 1);
      i -=1;
    }
  }

  return this;
};

RecordArray.prototype.info = function info() {
  var _ra = this;

  return this.map(function(item) {
    return {
      id: item.id ? item.id : item,
      type: _ra.relationship.type
    };
  });
};


Many.prototype.reference = function(values) {
  if (!values) {
    return null;
  }

  if (!(values instanceof Array)) {
    values = [values];
  }

  var namespace = this.store.namespaceFor(this.type);
  var records = new RecordArray();

  records.relationship = this;
  records.namespace = namespace;

  for (var i = 0; i < values.length; i++) {
    records.push(values[i]);
  }

  return records.fetch();
};

Many.prototype.defaultValue = function defaultValue() {

  var val = (typeof this.options.defaultValue === 'function') ?
    this.options.defaultValue() : this.options.defaultValue;

  // console.log('defaultValue ' + this.parentType + '#many(' + this.type + ')', val);
  if (typeof val === 'number') {
    var namespace = this.store.namespaceFor(this.type);

    if (this.options.inverse) {
      var def = {};
      def[this.options.inverse] = this.parent.id;
      val = namespace.seed(val, def);
    } else {
      val = namespace.seed(val);
    }
  }

  // console.log('seeding many of ' + this.type + ': ', val);
  return val;
};

Many.prototype.store = null;

module.exports = Many;
