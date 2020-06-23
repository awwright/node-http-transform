"use strict";

module.exports.ResponseTransform = require('./lib/ResponseTransform.js').ServerResponseTransform;
module.exports.ResponsePassThrough = require('./lib/PassThrough.js').PassThrough;
module.exports.PassThrough = require('./lib/PassThrough.js').PassThrough;
module.exports.Headers = require('./lib/Headers.js').Headers;
module.exports.makeResponsePair = require('./lib/Pair.js').makeResponsePair;
module.exports.ResponsePair = require('./lib/Pair.js').ResponsePair;
module.exports.makeRequestPair = require('./lib/Pair.js').makeRequestPair;
module.exports.RequestPair = require('./lib/Pair.js').RequestPair;

// depreciated aliases
module.exports.ServerResponseTransform = require('./lib/ResponseTransform.js').ServerResponseTransform;
module.exports.ServerResponsePassThrough = require('./lib/PassThrough.js').PassThrough;
