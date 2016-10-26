/*jshint node:true*/
var bodyParser = require('body-parser');
var pluralize = require('./utils/pluralize');
var chalk = require('chalk');
var Validator = require('jsonapi-validator').Validator;
var Schema = require('./schema.json');
var validator = new Validator(Schema);

function colorBGForMethod(method) {
  switch (method) {
    case 'DELETE':
      return 'bgRed';
    case 'PUT':
      return 'bgYellow';
    case 'PATCH':
      return 'bgMagenta';
    case 'POST':
      return 'bgBlue';
    case 'GET':
      return 'bgGreen';
    default:
      return 'bgBlack';
  }
}

function colorBGForStatus(method) {
  switch (method) {
    case 206:
    case 200:
      return 'bgGreen';
    case 404:
    case 405:
    case 403:
    case 406:
      return 'bgRed';
    case 204:
      return 'bgYellow';
    case 202:
      return 'bgMagenta';
    case 201:
      return 'bgBlue';
    default:
      return 'bgCyan';
  }
}

function stringifyValidationError(e) {
  return chalk.cyan(e.keyword) + ' ' + chalk.white(e.message);
}

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

    for (var i = 0; i < e.errors.length; i++) {
      console.log('\t' + (i + 1) + ')\t' + stringifyValidationError(e.errors[i]));
    }
    console.log('\n');
  }

  return json;
}

function logApiRequest(shouldLog, req) {
  if (shouldLog) {
    console.log(
      '\tMock Request\t' +
      chalk[colorBGForMethod(req.method)](chalk.bold(chalk.white(' ' + req.method + ' '))) + ' ' +
      chalk.white(req.baseUrl) +
      chalk.yellow(req._parsedUrl.search || '')
    );
  }
}

function logApiResponse(shouldLog, res, payload) {
  if (shouldLog) {
    var response;
    if (payload) {
      var totalRecords = payload.data instanceof Array ? payload.data.length : 1;
      var includedRecords = payload.included ? payload.included.length : 0;
      response = chalk.cyan(
        ' ' + totalRecords + ' primary records, ' + includedRecords + ' included records'
      );
    } else {
     response = chalk.yellow('Request Returned an Empty Response');
    }

    console.log(
      '\tMock Response\t' +
      chalk[colorBGForStatus(res.statusCode)](
        chalk.bold(chalk.white(' ' + res.statusCode + ' ' + res.statusMessage + ' '))
      ) + response
    );
  }
}


module.exports = function(app, modelName) {
  var express = require('express');
  var router = express.Router();
  var shouldLogRequest = app.store._config.logApiRequests;
  var shouldLogResponse = app.store._config.logApiResponses;

  var logRequest = function(req) {
    logApiRequest(shouldLogRequest, req);
  };
  var logResponse = function(res, payload) {
    logApiResponse(shouldLogResponse, res, payload);
  };

  function respond(res, responseData, statusCode) {
    if (responseData && !(statusCode >= 500)) {
      validateJsonApi(responseData);
    }

    res.status(statusCode);
    res.send(responseData);

    logResponse(res, responseData);
  }

  router.get('/', function(req, res) {
    logRequest(req, modelName);
    var responseData;
    try {
      responseData = app.store.query(modelName, req.query);
      respond(res, responseData, responseData && responseData.data ? 200 : 404);
    } catch (e) {
      respond(res, e.message, 500);
    }
  });

  router.post('/', function(req, res) {
    logRequest(req, modelName);
    var responseData;
    try {
      responseData = app.store.createRecord(modelName, req.body);
      respond(res, responseData, responseData && responseData.data ? 201 : 204);
    } catch (e) {
      respond(res, e.message, 500);
    }
  });

  router.get('/:id', function(req, res) {
    logRequest(req, modelName);
    var responseData;
    try {
      responseData = app.store.findRecord(modelName, req.params.id, req.query);
      respond(res, responseData, responseData && responseData.data ? 200 : 404);
    } catch (e) {
      respond(res, e.message, 500);
    }
  });

  router.put('/:id', function(req, res) {
    logRequest(req, modelName);
    var responseData;
    try {
      responseData = app.store.updateRecord(modelName, req.params.id, req.body);
      respond(res, responseData, responseData && responseData.data ? 201 : 204);
    } catch (e) {
      respond(res, e.message, 500);
    }
  });

  router.delete('/:id', function(req, res) {
    logRequest(req, modelName);
    var responseData;
    try {
      responseData = app.store.deleteRecord(modelName, req.params.id);
      respond(res, responseData, responseData && responseData.data ? 201 : 204);
    } catch (e) {
      respond(res, e.message, 500);
    }
  });

  app.use('/api/' + pluralize(modelName), bodyParser.json());
  app.use('/api/' + pluralize(modelName), router);
};
