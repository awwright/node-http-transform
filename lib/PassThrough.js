"use strict";
const inherits = require('util').inherits;

var ServerResponseTransform = require('./ServerResponseTransform.js').ServerResponseTransform;

// Pipe through an HTTP request - can serve to merge two streams together, e.g. to set Content-Type
module.exports.PassThrough = ServerResponsePassThrough;
inherits(ServerResponsePassThrough, ServerResponseTransform);
function ServerResponsePassThrough(){
	if (!(this instanceof ServerResponsePassThrough)){
		return new ServerResponsePassThrough();
	}
	ServerResponseTransform.apply(this, arguments);
}

ServerResponsePassThrough.prototype._transformHead = function _transformHead(headers, cb) {
	if(typeof cb=='function') cb(null, headers);
	return headers;
};

ServerResponsePassThrough.prototype._transform = function _transform(chunk, encoding, cb) {
	cb(null, chunk, encoding);
};


