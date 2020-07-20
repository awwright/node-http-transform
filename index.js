"use strict";

module.exports.Headers = require('./lib/Headers.js').Headers;

module.exports.ResponseWritable = require('./lib/ResponseTransform.js').ResponseWritable;
module.exports.ResponseReadable = require('./lib/ResponseTransform.js').ResponseReadable;
module.exports.ResponseTransform = require('./lib/ResponseTransform.js').ResponseTransform;
module.exports.ResponsePassThrough = require('./lib/PassThrough.js').ResponsePassThrough;
module.exports.ResponsePair = require('./lib/Pair.js').ResponsePair;
module.exports.RequestPair = require('./lib/Pair.js').RequestPair;

// depreciated aliases
module.exports.ServerResponseTransform = require('./lib/ResponseTransform.js').ResponseTransform;
module.exports.ServerResponsePassThrough = require('./lib/PassThrough.js').ResponsePassThrough;
module.exports.PassThrough = require('./lib/PassThrough.js').ResponsePassThrough;
