
const assert = require('assert');
const ServerResponseTransform = require('..').ServerResponseTransform;
const ServerResponseBuffer = require('./Buffer.js').ServerResponseBuffer;
const { createReadStream } = require('fs');
const { PassThrough } = require('stream');

describe('Transform', function() {
	it('methods', function(done) {
		var t = new ServerResponseTransform({
			transformHead: function(res){ console.log('transformHead'); return res; },
			transform: function(data, enc, cb){
				console.log('transform');
				cb(null, data + '!');
			},
			flush: function(cb){
				console.log('flush');
				cb();
			},
			final: function(cb){
				console.log('final');
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
		t.setHeader('Content-Type', 'application/ecmascript');
		var end = new ServerResponseBuffer;
		end.on('finish', function(){
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
			done();
		});
		src.end('test');
		src.pipe(t).pipe(end);
	});
	it('headers transform asynchronous', function() {
		return;
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
});
