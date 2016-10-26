var Attr = require('./factory/attr');
var One = require('./factory/one');
var Many = require('./factory/many');

module.exports = {

  attr: function(type, options) {
    return new Attr(type, options);
  },

  many: function(name, options) {
    return new Many(name, options);
  },

  one: function(name, options) {
    return new One(name, options);
  }

};
