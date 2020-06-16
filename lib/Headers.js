"use strict";

module.exports.Headers = Headers;

function Headers(from){
	this.statusCode = null;
	this.statusMessage = '';
	this._header = null;
	this._headerList = {};
	// this.rawHeaders = [];
}

Headers.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	// Copy status code
	if(this.method) dst.method = this.method;
	if(this.statusCode) dst.statusCode = this.statusCode;
	if(this.statusMessage) dst.statusMessage = this.statusMessage;
	// Copy headers
	for(var k in this._headerList){
		dst.setHeader(this._headerList[k][0], this._headerList[k][1]);
	}
	return dst;
};

Headers.prototype.getHeader = function getHeader(name) {
	var entry = this._headerList[name.toLowerCase()];
	return entry && entry[1];
};
 
Headers.prototype.setHeader = function setHeader(name, value){
	if (this._header) {
		throw new Error('setHeader');
	}
	if(typeof name!=='string') throw new Error('Expected string `name`');
	if(typeof value!=='string' && typeof value!=='number' && !Array.isArray(value)) throw new Error('Expected string `value`');
	var self = this;
	self._headerList[name.toLowerCase()] = [name, value];
};

Headers.prototype.addHeader = function addHeader(name, value){
	if (this._header) {
		throw new Error('addHeader');
	}
	if(typeof name!=='string') throw new Error('Expected string `name`');
	if(typeof value!=='string' && typeof value!=='number' && !Array.isArray(value)) throw new Error('Expected string `value`');
	var self = this;
	var old = this.getHeader(name);
	if(Array.isArray(old)){
		self._headerList[name.toLowerCase()] = [name, old.concat(value)];
	}else if(typeof old==='string'){
		self._headerList[name.toLowerCase()] = [name, [old, value]];
	}else if(old===undefined){
		self._headerList[name.toLowerCase()] = [name, value];
	}else{
		throw new Error('Unknown existing value');
	}
};

Headers.prototype.removeHeader = function removeHeader(name){
	if (this._header) {
		throw new Error('removeHeader');
	}
	if(typeof name!=='string') throw new Error('Expected string `name`');
	var self = this;
	var key = name.toLowerCase();
	delete self._headerList[key];
};

Headers.prototype.getHeaderNames = function getHeaderNames() {
	return this._headerList !== null ? Object.keys(this._headerList) : [];
};

Headers.prototype.getHeaders = function getHeaders() {
	const headers = this._headerList;
	const ret = Object.create(null);
	if (headers) {
		const keys = Object.keys(headers);
		for (var i = 0; i<keys.length; ++i) {
			ret[ keys[i] ] = headers[keys[i]][1];
		}
	}
	return ret;
};

Headers.prototype.hasHeader = function hasHeader(name) {
	return this._headerList !== null && !!this._headerList[name.toLowerCase()];
};

Headers.prototype.toString = function toString(name) {
	var list = this._headerList;
	return this.getHeaderNames().map(function(name){
		var pair = list[name];
		if(typeof pair[1]==='string') return pair[0] + ': ' + pair[1] + '\r\n';
		return pair[1].map(function(v){
			return pair[0] + ': ' + v + '\r\n';
		}).join('');
	}).join('');
};
