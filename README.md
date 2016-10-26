# JsonAPI Mock Server

A simple json-api validated mock server.

## Installation

```cli
yarn add json-api-mock-server
```

## Setup

```js
var mountEndpoints = require('json-api-mock-server');

mountEndpoints(app, config);
```

`app` is expected to be an express application instance.

`json-api-mock-server` expects to find:

- models at `<project>/server/models/*.js`
- scenarios at `<project>/server/scenarios/*.js`

It will gracefully warn when these aren't found.

### Config Settings (with defaults)

```js
{
  logApiRequests: true,
  logApiResponses: true,
  serializer: null,
  scenario: 'default'
  apiNamespace: 'api'
}
```

### Use with ember-cli

In `server/index.js` (add this file if not present):

```js
/*jshint node:true*/
var mountEndpoints = require('json-api-mock-server');
var config = {
   logApiRequests: true,
   logApiResponses: true,
   serializer: null,
   scenario: 'default'
   apiNamespace: 'api'
 };
 
module.exports = function(app) {
  mountEndpoints(app, config);
};
```

You will put the `models` and `scenarios` directories inside of
this `server/` directory.

## Models

Creating a simple model (no relationships): example `server/models/foo.js`

```js
var faker = require('faker');
var props = require('json-api-mock-server/lib/store/props');
var between = require('json-api-mock-server/lib/utils/between');
var attr = props.attr;

module.exports = {
  title: attr('string', { defaultValue: function() { return faker.lorem.words(between(3, 5)); }}),
  bar: one('bar', { inverse: 'foo', defaultValue: false }),
};
```

Creating a model `foo`with a one-to-(one|none|many) relationship with
 another model `bar`

```
var faker = require('faker');
var props = require('json-api-mock-server/lib/store/props');
var between = require('json-api-mock-server/lib/utils/between');
var attr = props.attr;
var one = props.one;

module.exports = {
  title: attr('string', { defaultValue: function() { return faker.lorem.words(between(3, 5)); }}),
  bar: one('bar', { inverse: 'foo', defaultValue: false }),
};
```

- Omit `inverse` or set it to a false-y value for `one-to-none` behavior.
- setting `defaultValue` to `true` will cause a related model to be created
  while seeding the database. Setting it to `false` will cause there
  to be no related model for this record.
- `defaultValue` can also be a function that returns `true` or `false`.


Creating a model `foo`with a many-to-(one|none|many) relationship with
 another model `bar`

```
var faker = require('faker');
var props = require('json-api-mock-server/lib/store/props');
var between = require('json-api-mock-server/lib/utils/between');
var attr = props.attr;
var many = props.many;

module.exports = {
  title: attr('string', { defaultValue: function() { return faker.lorem.words(between(3, 5)); }}),
  bars: many('bar', { inverse: 'foo', defaultValue: function() { return between(0, 3); }),
};
```

- `defaultValue` can be numeric
- the number you set `defaultValue` to or which `defaultValue()` returns
  represents the total number of relationships to seed for the related model.
  e.g. returning `4` will cause `4` `bar` records to be instantiated.

## Scenarios
