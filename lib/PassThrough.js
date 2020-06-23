"use strict";

const inherits = require('util').inherits;

var ResponseTransform = require('./ResponseTransform.js').ResponseTransform;

// Pipe through an HTTP request - can serve to merge two streams together, e.g. to set Content-Type
module.exports.PassThrough = ResponsePassThrough;
inherits(ResponsePassThrough, ResponseTransform);
function ResponsePassThrough(){
	if (!(this instanceof ResponsePassThrough)){
		return new ResponsePassThrough();
	}
	ResponseTransform.apply(this, arguments);
}

ResponsePassThrough.prototype._transformHead = function _transformHead(headers, cb) {
	if(typeof cb=='function') cb(null, headers);
	return headers;
};

ResponsePassThrough.prototype._transform = function _transform(chunk, encoding, cb) {
	cb(null, chunk, encoding);
};
