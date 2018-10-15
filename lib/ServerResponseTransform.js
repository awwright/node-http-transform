
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
	Transform.prototype.pipe.call(this, dst, opt);
	return dst;
}

Headers.export(ServerResponseTransform);

ServerResponseTransform.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	var self = this;
	// Copy status code
	if(typeof dst.setStatusCode=='function') dst.setStatusCode(this.statusCode);
	else dst.statusCode = this.statusCode;
	// Copy headers
	for(var k in this._headerList){
		dst.setHeader(this._headerList[k][0], this._headerList[k][1]);
	}
	return dst;
}

ServerResponseTransform.prototype.push = function push(chunk, encoding){
	var self = this;
	var returns = 0;
	if(!this._headers){
		var headers = new Headers();
		this.pipeHeaders(headers);
		this._headers = this._transformHead(headers);
		if(!this._headers) this._headers = headers;
		else if(!(this._headers instanceof Headers)) throw new Error('Expected return value to be instanceof Headers');
		self._destinations().forEach(function(dst){ self._headers.pipeHeaders(dst); });
		Transform.prototype.push.call(self, chunk, encoding);
	}else{
		Transform.prototype.push.call(self, chunk, encoding);
	}
}

ServerResponseTransform.prototype.setStatusCode = function setStatusCode(value){
	var self = this;
	self._destinations().forEach(function(dst){
		if(typeof dst.setStatusCode=='function') dst.setStatusCode(value);
		else dst.statusCode = value;
	});
	self.statusCode = value;
}

ServerResponseTransform.prototype.setHeader = function setHeader(name, value){
	if(typeof name!=='string') throw new Error('Expected string `name`');
	if(typeof value!=='string') throw new Error('Expected string `value`');

	var self = this;
	self._headerList[name.toLowerCase()] = [name, value];
}

ServerResponseTransform.prototype.getHeader = function getHeader(name) {
  var entry = this._headerList[name.toLowerCase()];
  return entry && entry[1];
};

ServerResponseTransform.prototype.getHeaderNames = function getHeaderNames() {
  return this._headerList !== null ? Object.keys(this._headerList) : [];
};

ServerResponseTransform.prototype.getHeaders = function getHeaders() {
  const headers = this._headerList;
  const ret = Object.create(null);
  if (headers) {
    const keys = Object.keys(headers);
    for (var i = 0; i<keys.length; ++i) {
      ret[ keys[i] ] = headers[key][1];
    }
  }
  return ret;
};

ServerResponseTransform.prototype.hasHeader = function hasHeader(name) {
  return this._headerList !== null && !!this._headerList[name.toLowerCase()];
};
