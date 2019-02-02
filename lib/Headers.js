
module.exports.Headers = Headers;

function Headers(from){
	this.statusCode = 200;
	this.statusMessage = '';
	this._headerList = {};
	this.headers = {};
	this.rawHeaders = [];
}

Headers.export = function(target){
	const keys = Object.keys(Headers.prototype);
	for(var v=0; v<keys.length; v++) {
		const method = keys[v];
		if (!target.prototype[method]){
			target.prototype[method] = Headers.prototype[method];
		}
	}
}

Headers.prototype.pipeHeaders = function pipeHeaders(dst, opt){
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
Headers.prototype.setHeader = function setHeader(name, value){
	if(typeof name!=='string') throw new Error('Expected string `name`');
	if(typeof value!=='string' && !Array.isArray(value)) throw new Error('Expected string `value`');
	var self = this;
	self._headerList[name.toLowerCase()] = [name, value];
	self.headers[name.toLowerCase()] = value;
}
