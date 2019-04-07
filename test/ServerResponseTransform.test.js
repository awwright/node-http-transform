
const assert = require('assert');
const ServerResponseTransform = require('..').ServerResponseTransform;
const ServerResponseBuffer = require('./Buffer.js').ServerResponseBuffer;
const ServerResponsePassThrough = require('..').ServerResponsePassThrough;
const { PassThrough } = require('stream');

describe('Transform', function() {
	it('methods', function(done) {
		var t = new ServerResponseTransform({
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
		var t = new ServerResponseTransform({
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
		var t = new ServerResponseTransform({
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
		var t = new ServerResponseTransform({
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
		var t = new ServerResponseTransform({
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
		var t = new ServerResponseTransform({
			transformHead: function(res, cb){
				setTimeout(function(){
					res.setHeader('Content-Type', 'application/xml');
					cb(null, res);
				}, 100);
			},
			transform: function(data, enc, cb){ debugger; cb(null, data+' x'); },
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
		var t = new ServerResponseTransform({
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
	it('read contents then set headers (ServerResponsePassThrough)', function(done) {
		var t = new ServerResponseTransform({
			transformHead: function(res){ return res; },
			transform: function(data, enc, cb){ cb(null); },
			flush: function(cb){ this.setHeader('Content-Type', 'text/plain'); cb(null, 'Content'); },
			final: function(cb){ cb(); },
		});
		var src = new ServerResponsePassThrough;
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
		src.pipe(t).pipe(ServerResponsePassThrough()).pipe(end);
	});
	it('setStatusCode (ServerResponsePassThrough)', function(done) {
		var src = new ServerResponsePassThrough;
		var ttt = new ServerResponseTransform({
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
		src.pipe(ttt).pipe(ServerResponsePassThrough()).pipe(end);
	});
	// TODO: Verify errors after first body is written
});

