"use strict";

const inherits = require('util').inherits;
const ServerResponseTransform = require('../lib/ResponseTransform.js').ResponseTransform;

// Pipe through an HTTP request - can serve to merge two streams together, e.g. to set Content-Type
module.exports.ServerResponseBuffer = ServerResponseBuffer;
inherits(ServerResponseBuffer, ServerResponseTransform);
function ServerResponseBuffer(){
	if (!(this instanceof ServerResponseBuffer)){
		return new ServerResponseBuffer();
	}
	ServerResponseTransform.apply(this, arguments);
	this.headers = {};
	this.body = '';
}

ServerResponseBuffer.prototype.setHeader = function(name, value) {
	this.headers[name.toLowerCase()] = value;
	ServerResponseTransform.prototype.setHeader.apply(this, arguments);
};

ServerResponseBuffer.prototype._transformHead = function _transformHead(res, cb) {
	if(typeof cb=='function') cb(null, res);
	return res;
};

ServerResponseBuffer.prototype._transform = function _transform(chunk, encoding, cb) {
	var str = chunk.toString();
	this.body += str;
	cb(null, chunk);
};


