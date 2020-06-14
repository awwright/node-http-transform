"use strict";

var assert = require('assert');
var stream = require('stream');

var lib = require('..');

describe('makeResponsePair', function(){
	describe('streams', function(){
		var pair, serverWritableSide, clientReadableSide;
		beforeEach(function(){
			pair = lib.makeResponsePair();
			serverWritableSide = pair.serverWritableSide;
			clientReadableSide = pair.clientReadableSide;
		});
		it('statusCode is read by client', function(){
			serverWritableSide.statusCode = 500;
			assert.strictEqual(clientReadableSide.statusCode, 500);
		});
		it('statusMessage is read by client', function(){
			serverWritableSide.statusCode = 400;
			serverWritableSide.statusMessage = 'NOT OK';
			assert.strictEqual(clientReadableSide.statusMessage, 'NOT OK');
		});
		it('setHeader is read by client', function(){
			serverWritableSide.setHeader('Content-Type', 'text/plain; charset=UTF-8');
			assert.strictEqual(clientReadableSide.hasHeader('Content-Type'), true);
			assert.strictEqual(clientReadableSide.getHeader('Content-Type'), 'text/plain; charset=UTF-8');
		});
		it('removeHeader is read by client', function(){
			assert.strictEqual(serverWritableSide.hasHeader('Date'), true);
			serverWritableSide.removeHeader('Date');
			assert.strictEqual(clientReadableSide.hasHeader('Date'));
		});
		it('writes on server are read by client', function(){
			serverWritableSide.end('x');
			assert.strictEqual(clientReadableSide.read(1).toString(), 'x');
		});
		it('addTrailers on server are read by client', function(){
			serverWritableSide.addTrailers({'Foo': 'Bar'});
			serverWritableSide.end();
			assert.strictEqual(clientReadableSide.trailers, 'x');
		});
		it('close on server is read by client', function(done){
			serverWritableSide.write('x');
			serverWritableSide.end();
			clientReadableSide.resume();
			clientReadableSide.on('end', done);
		});
	});
	describe('serverWritableSide instanceof ServerResponse', function(){
		it('unsigned short statusCode');
		it('string statusMessage');
		it('writeContinue()');
		it('writeProcessing()');
		it('writeHead()');
	});
	describe('serverWritableSide instanceof OutgoingMessage', function(){
		it('setHeader(name, value)');
		it('getHeader(name)');
		it('getHeaderNames()');
		it('getHeaders()');
		it('hasHeader()');
		it('removeHeader()');
		it('write()');
		it('addTrailers()');
		it('end()');
		it('flushHeaders()');
		it('pipe()');
	});
	describe('clientReadableSide instanceof IncomingMessage', function(){
		it('rawTrailers');
		it('trailers');
		it('statusCode');
		it('statusMessage');
		it('url');
		it('httpVersion');
		it('headers');
		it('complete');
		it('aborted');
		it('setTimeout(msecs, callback)');
		it('destroy(error)');
	});
});
