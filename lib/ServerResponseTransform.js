
const Transform = require('stream').Transform;
const util = require('util');

const { Headers } = require('./Headers.js');

module.exports.ServerResponseTransform = ServerResponseTransform;
util.inherits(ServerResponseTransform, Transform);
function ServerResponseTransform(options){
	Transform.call(this, options);
	Headers.call(this);
	this.statusCode = 200;
	this._header = null;
	this._headerList = [];
	options = options || {};
	if(options.transformHead) this._transformHead = options.transformHead;
	if(!this._transform) throw new Error('_transform expected');
	if(!this._transformHead) throw new Error('_transformHead expected');
	
}
ServerResponseTransform.prototype._destinations = function _destinations(){
	if(this._readableState.pipesCount==0) return [];
	if(this._readableState.pipesCount==1) return [this._readableState.pipes];
	return this._readableState.pipes;
}
ServerResponseTransform.prototype.pipe = function pipe(dst, opt){
	var self = this;
	// First copy metadata to dst:
	if(self._headers) self._headers.pipeHeaders(dst);
	Transform.prototype.pipe.call(self, dst, opt);
	return dst;
}

ServerResponseTransform.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	var self = this;
	// Copy status code
	if(typeof dst.setStatusCode=='function') dst.setStatusCode(self.statusCode);
	else dst.statusCode = self.statusCode;
	// Copy headers
	for(var k in this._headerList){
		dst.setHeader(self._headerList[k][0], self._headerList[k][1]);
	}
	return dst;
}

ServerResponseTransform.prototype.push = function push(chunk, encoding){
	var self = this;
	if(!this._headers){
		var headers = new Headers();
		this.pipeHeaders(headers);
		this._headers = this._transformHead(headers);
		if(!this._headers) this._headers = headers;
		else if(!(this._headers instanceof Headers)) throw new Error('Expected return value to be instanceof Headers');
		self._destinations().forEach(function(dst){ self._headers.pipeHeaders(dst); });
	}
	Transform.prototype.push.call(self, chunk, encoding);
}

ServerResponseTransform.prototype.setStatusCode = Headers.prototype.setStatusCode;
ServerResponseTransform.prototype.setHeader = Headers.prototype.setHeader;
ServerResponseTransform.prototype.hasHeader = Headers.prototype.hasHeader;
ServerResponseTransform.prototype.getHeader = Headers.prototype.getHeader;
ServerResponseTransform.prototype.removeHeader = Headers.prototype.removeHeader;
ServerResponseTransform.prototype.getHeaders = Headers.prototype.getHeaders;
ServerResponseTransform.prototype.getHeaderNames = Headers.prototype.getHeaderNames;
