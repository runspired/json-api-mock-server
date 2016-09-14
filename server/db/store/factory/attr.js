function Attr(type, options) {
  this.type = type;
  this.options = options;
}

Attr.prototype.defaultValue = function defaultValue() {
  return (typeof this.options.defaultValue === 'function') ?
    this.options.defaultValue() : this.options.defaultValue;
};

module.exports = Attr;
