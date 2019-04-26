"use strict";

module.exports.Headers = Headers;

function Headers(from){
	this.statusCode = null;
	this.statusMessage = '';
	this._headerList = {};
	// this.rawHeaders = [];
}

Headers.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	var self = this;
	// Copy status code
	if(this.statusCode) dst.statusCode = this.statusCode;
	if(this.statusMessage) dst.statusMessage = this.statusMessage;
	// Copy headers
	for(var k in this._headerList){
		dst.setHeader(this._headerList[k][0], this._headerList[k][1]);
	}
	return dst;
}

Headers.prototype.getHeader = function getHeader(name) {
	var entry = this._headerList[name.toLowerCase()];
	return entry && entry[1];
}
 
Headers.prototype.setHeader = function setHeader(name, value){
	if(typeof name!=='string') throw new Error('Expected string `name`');
	if(typeof value!=='string' && !Array.isArray(value)) throw new Error('Expected string `value`');
	var self = this;
	self._headerList[name.toLowerCase()] = [name, value];
}

Headers.prototype.removeHeader = function removeHeader(name){
	if(typeof name!=='string') throw new Error('Expected string `name`');
	var self = this;
	var key = name.toLowerCase();
	delete self._headerList[key];
}

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
