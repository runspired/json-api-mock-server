function lastChar(s) {
  return s[s.length - 1];
}
module.exports = function(str) {
  switch (lastChar(str)) {
    case 'x':
    case 'i':
      return str + 'es';
    case 'y':
      return str.substr(0, str.length - 1) + 'ies';
    default:
      return str + 's';
  }
};
