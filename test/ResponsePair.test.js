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
});
