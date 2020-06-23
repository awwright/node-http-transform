"use strict";

const inherits = require('util').inherits;

var ResponseTransform = require('./ResponseTransform.js').ResponseTransform;

// Pipe through an HTTP request - can serve to merge two streams together, e.g. to set Content-Type
module.exports.PassThrough = ServerResponsePassThrough;
inherits(ServerResponsePassThrough, ResponseTransform);
function ServerResponsePassThrough(){
	if (!(this instanceof ServerResponsePassThrough)){
		return new ServerResponsePassThrough();
	}
	ResponseTransform.apply(this, arguments);
}

ServerResponsePassThrough.prototype._transformHead = function _transformHead(headers, cb) {
	if(typeof cb=='function') cb(null, headers);
	return headers;
};

ServerResponsePassThrough.prototype._transform = function _transform(chunk, encoding, cb) {
	cb(null, chunk, encoding);
};
