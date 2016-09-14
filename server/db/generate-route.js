/*jshint node:true*/
var bodyParser = require('body-parser');
var pluralize = require('./utils/pluralize');

module.exports = function(app, modelName) {
  var express = require('express');
  var router = express.Router();

  router.get('/', function(req, res) {
    console.warn('GET api/' + modelName + '/' + ' limit:' + (req.query.limit || 250));
    res.send(app.store.query(
        modelName,
        {
          limit: req.query.limit || 250,
          page: req.query.page || 0
        }
      ));

  });

  router.post('/', function(req, res) {
    res.status(201).send(
      app.store.createRecord(modelName, req.body));
  });

  router.get('/:id', function(req, res) {
    res.send(
      app.store.findRecord(modelName, req.params.id));
  });

  router.put('/:id', function(req, res) {
    res.send(
      app.store.updateRecord(modelName, req.params.id, req.body));
  });

  router.delete('/:id', function(req, res) {
    app.store.deleteRecord(modelName, req.params.id);
    res.status(204).end();
  });

  app.use('/api/' + pluralize(modelName), bodyParser.json());
  app.use('/api/' + pluralize(modelName), router);
};
