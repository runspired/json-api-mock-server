module.exports = function between(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
};
