function One(type, options) {
  this.type = type;
  this.options = options;
}

function Reference(num) {
  this.value = num;
}

Reference.prototype.relationship = null;
Reference.prototype.namespace = null;

Reference.prototype.toJSON = function toJSON() {
  return this.value;
};

Reference.prototype.fetch = function fetch() {
  this.value = (this.value && typeof this.value === 'string') ?
    this.namespace.findReference(this.value) : this.value;

  // self clean
  if (!this.value || this.value.__deleted) {
    this.value = null;
  }

  return this;
};

Reference.prototype.info = function info() {
  return { id: this.value.id || this.value, type: this.relationship.type };
};


One.prototype.reference = function(value) {
  if (!value) {
    return null;
  }

  var namespace = this.store.namespaceFor(this.type);
  var reference = new Reference(value);

  reference.relationship = this;
  reference.namespace = namespace;

  return reference.fetch();
};



One.prototype.defaultValue = function defaultValue() {

  var val = (typeof this.options.defaultValue === 'function') ?
    this.options.defaultValue() : this.options.defaultValue;

  if (val === true) {
    var namespace = this.store.namespaceFor(this.type);

    if (this.options.inverse) {
      var def = {};
      def[this.options.inverse] = this.parent.id;
      val = namespace.seed(1, def)[0];
    } else {
      val = namespace.seed(1);
    }

  } else if (val === false) {
    val = undefined;
  }

  if (val) {
    // console.log('defaultValue ' + this.parent.type + ':' + this.parent.id + '#one(' + this.type + ':' + val.id + ')');
  }
  return val;
};



One.prototype.store = null;

module.exports = One;
