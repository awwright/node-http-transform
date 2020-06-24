"use strict";

const assert = require('assert');
const ResponseTransform = require('..').ResponseTransform;
const ServerResponseBuffer = require('./Buffer.js').ServerResponseBuffer;
const ResponsePassThrough = require('..').ResponsePassThrough;
const { PassThrough } = require('stream');

describe('Transform', function() {
	it('methods', function(done) {
		var t = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){
				// console.log('transform');
				cb(null, data + '!');
			},
			flush: function(cb){
				// console.log('flush');
				cb();
			},
			final: function(cb){
				// console.log('final');
				cb();
			},
		});
		var src = new PassThrough;
		src.end('test');
		src.pipe(t).on('finish', done);
	});
	it('modify content', function(done) {
		var t = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null, data+'!'); },
			flush: function(cb){ cb(); },
			final: function(cb){ cb(); },
		});
		var src = new PassThrough;
		t.setHeader('Content-Type', 'text/plain');
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.deepEqual(end.headers, {
				'content-type': 'text/plain',
			});
			assert.equal(end.body, 'test!');
			done();
		});
		src.end('test');
		src.pipe(t).pipe(end);
	});
	it('headers injection', function(done) {
		var t = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null, data); },
			flush: function(cb){ cb(); },
			final: function(cb){ cb(); },
		});
		var src = new PassThrough;
		t.setHeader('Content-Type', 'application/ecmascript');
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.deepEqual(end.headers, {
				'content-type': 'application/ecmascript',
			});
			assert.equal(end.body, 'test');
			done();
		});
		src.end('test');
		src.pipe(t).pipe(end);
	});
	it('headers injection (array)', function(done) {
		var t = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null, data); },
			flush: function(cb){ cb(); },
			final: function(cb){ cb(); },
		});
		var src = new PassThrough;
		t.setHeader('Link', ['<3>;rel=next', '<1>;rel=prev']);
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.deepEqual(end.headers, {
				'link': ['<3>;rel=next', '<1>;rel=prev'],
			});
			assert.equal(end.body, 'test');
			done();
		});
		src.end('test');
		src.pipe(t).pipe(end);
	});
	it('headers transform immediate', function(done) {
		var t = new ResponseTransform({
			transformHead: function(res){
				res.setHeader('Content-Type', 'application/xml');
				return res;
			},
			transform: function(data, enc, cb){ cb(null, data); },
			flush: function(cb){ cb(); },
			final: function(cb){ cb(); },
		});
		var src = new PassThrough;
		t.setHeader('Content-Type', 'application/ecmascript');
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.deepEqual(end.headers, {
				'content-type': 'application/xml',
			});
			assert.equal(end.body, 'test');
			done();
		});
		src.end('test');
		src.pipe(t).pipe(end);
	});
	it('headers transform asynchronous', function() {
		return void this.skip();
		var t = new ResponseTransform({
			transformHead: function(res, cb){
				setTimeout(function(){
					res.setHeader('Content-Type', 'application/xml');
					cb(null, res);
				}, 100);
			},
			transform: function(data, enc, cb){ cb(null, data+' x'); },
			flush: function(cb){ cb(); },
			final: function(cb){ cb(); },
		});
		var src = new PassThrough;
		t.setHeader('Content-Type', 'application/ecmascript');
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.deepEqual(end.headers, {
				'content-type': 'application/xml',
			});
			done();
		});
		src.end('test');
		src.pipe(t).pipe(end);
	});
	it('read contents then set headers', function(done) {
		var t = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null); },
			flush: function(cb){ this.setHeader('Content-Type', 'text/plain'); cb(null, 'Content'); },
			final: function(cb){ cb(); },
		});
		var src = new PassThrough;
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.deepEqual(end.headers, {
				'content-type': 'text/plain',
			});
			assert(end.hasHeader('Content-Type'));
			assert(end.hasHeader('content-type'));
			assert(!end.hasHeader('contenttype'));
			assert.equal(end.getHeader('Content-Type'), 'text/plain');
			assert.deepEqual(end.body, 'Content');
			done();
		});
		t.setHeader('Content-Type', 'text/css');
		src.end('test');
		src.pipe(t).pipe(end);
	});
	it('read contents then set headers (ResponsePassThrough)', function(done) {
		var t = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null); },
			flush: function(cb){ this.setHeader('Content-Type', 'text/plain'); cb(null, 'Content'); },
			final: function(cb){ cb(); },
		});
		var src = new ResponsePassThrough;
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.deepEqual(end.headers, {
				'content-type': 'text/plain',
			});
			assert(end.hasHeader('Content-Type'));
			assert(end.hasHeader('content-type'));
			assert(!end.hasHeader('contenttype'));
			assert.equal(end.getHeader('Content-Type'), 'text/plain');
			assert.deepEqual(end.body, 'Content');
			done();
		});
		t.setHeader('Content-Type', 'text/css');
		src.end('test');
		src.pipe(t).pipe(ResponsePassThrough()).pipe(end);
	});
	it('setStatusCode (ResponsePassThrough)', function(done) {
		var src = new ResponsePassThrough;
		var ttt = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null); },
			flush: function(cb){ this.statusCode = 204; this.setHeader('Content-Type', 'text/plain'); cb(null); },
			final: function(cb){ cb(); },
		});
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
			assert.equal(end.statusCode, 204);
			assert.equal(end.getHeader('Content-Type'), 'text/plain');
			done();
		});
		ttt.setHeader('Content-Type', 'text/css');
		src.end('test');
		src.pipe(ttt).pipe(ResponsePassThrough()).pipe(end);
	});
	it('on headersReady', function(done) {
		var data = 0;
		var src = new ResponsePassThrough;
		var ttt = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null); },
			flush: function(cb){ this.statusCode = 204; this.setHeader('Content-Type', 'text/plain'); cb(null); },
			final: function(cb){ cb(); },
		});
		var end = new ServerResponseBuffer;
		end.on('headersReady', function(){
			assert.equal(end.statusCode, 204);
			assert.equal(end.getHeader('Content-Type'), 'text/plain');
			assert(!data);
			done();
		});
		end.on('data', function(){
			data++;
		});
		ttt.setHeader('Content-Type', 'text/css');
		src.end('test');
		src.pipe(ttt).pipe(ResponsePassThrough()).pipe(end);
	});
	it('headersReady', function() {
		var data = 0;
		var src = new ResponsePassThrough;
		var ttt = new ResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null); },
			flush: function(cb){ this.statusCode = 204; this.setHeader('Content-Type', 'text/plain'); cb(null); },
			final: function(cb){ cb(); },
		});
		var end = new ServerResponseBuffer;
		end.on('data', function(){
			data++;
		});
		ttt.setHeader('Content-Type', 'text/css');
		src.end('test');
		src.pipe(ttt).pipe(ResponsePassThrough()).pipe(end);
		return end.headersReady.then(function(){
			assert(!data);
		});
	});
	// TODO: Verify errors after first body is written
});

