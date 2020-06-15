"use strict";

const assert = require('assert');
const http = require('http');

const lib = require('..');

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
		it.skip('removeHeader is read by client', function(){
			assert.strictEqual(serverWritableSide.hasHeader('Date'), true);
			serverWritableSide.removeHeader('Date');
			assert.strictEqual(clientReadableSide.hasHeader('Date'));
		});
		it('writes on server are read by client', function(){
			serverWritableSide.end('x');
			assert.strictEqual(clientReadableSide.read(1).toString(), 'x');
		});
		it.skip('addTrailers on server are read by client', function(){
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
	describe('serverWritableSide implements ServerResponse API', function(){
		var pair, serverWritableSide, clientReadableSide;
		beforeEach(function(){
			pair = lib.makeResponsePair();
			serverWritableSide = pair.serverWritableSide;
			clientReadableSide = pair.clientReadableSide;
		});
		// it('serverWritableSide instanceof ServerResponse', function(){
		// 	assert(serverWritableSide instanceof http.ServerResponse);
		// });
		it('statusCode', function(){
			serverWritableSide.statusCode = 400;
			serverWritableSide.end();
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.statusCode, 400);
			});
		});
		it('statusMessage', function(){
			serverWritableSide.statusMessage = 'Custom Message';
			serverWritableSide.end();
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.statusMessage, 'Custom Message');
			});
		});
		it('writeContinue()');
		it('writeProcessing()');
		it('writeHead(statusCode, statusMessage, headers)', function(){
			serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.statusCode, 400);
				assert.strictEqual(clientReadableSide.statusMessage, 'Message');
				assert.strictEqual(clientReadableSide.headers['allow'], 'GET, HEAD, POST');
			});
		});
	});
	describe('serverWritableSide implements OutgoingMessage API', function(){
		var pair, serverWritableSide, clientReadableSide;
		beforeEach(function(){
			pair = lib.makeResponsePair();
			serverWritableSide = pair.serverWritableSide;
			clientReadableSide = pair.clientReadableSide;
		});
		// it('serverWritableSide instanceof OutgoingMessage', function(){
		// 	assert(serverWritableSide instanceof http.OutgoingMessage);
		// });
		it('setHeader(name, value)', function(){
			serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
			serverWritableSide.end();
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.headers['allow'], 'GET, HEAD, POST');
			});
		});
		it('getHeader(name)', function(){
			serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
			assert.strictEqual(serverWritableSide.getHeader('ALLOW'), 'GET, HEAD, POST');
		});
		it('getHeaderNames()', function(){
			serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
			serverWritableSide.setHeader('Content-Type', 'application/xhtml+xml');
			assert.deepStrictEqual(serverWritableSide.getHeaderNames(), ['allow', 'content-type']);
		});
		it('getHeaders()', function(){
			serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
			serverWritableSide.setHeader('Content-Type', 'application/xhtml+xml');
			const headers = serverWritableSide.getHeaders();
			// FIXME is this expecting [Object: null prototype] ?
			assert.deepStrictEqual(headers['allow'], 'GET, HEAD, POST');
			assert.deepStrictEqual(headers['content-type'], 'application/xhtml+xml');
		});
		it('hasHeader()', function(){
			serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
			assert.strictEqual(serverWritableSide.hasHeader('ALLOW'), true);
			assert.strictEqual(serverWritableSide.hasHeader('Foo'), false);
		});
		it('removeHeader()', function(){
			serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
			serverWritableSide.removeHeader('Allow');
			assert.strictEqual(serverWritableSide.getHeader('Allow'), undefined);
			assert.strictEqual(serverWritableSide.getHeader('ALLOW'), undefined);
			assert.strictEqual(serverWritableSide.hasHeader('Allow'), false);
		});
		it('flushHeaders()', function(){
			serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
			serverWritableSide.flushHeaders();
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.headers['allow'], 'GET, HEAD, POST');
			});
		});
		it('write()', function(done){
			serverWritableSide.write('Content\r\n');
			clientReadableSide.setEncoding('UTF-8');
			clientReadableSide.on('readable', function(){
				assert.strictEqual(this.read(), 'Content\r\n');
				done();
			});
		});
		it('end()', function(done){
			serverWritableSide.end('Content\r\n');
			clientReadableSide.setEncoding('UTF-8');
			var data = '';
			clientReadableSide.on('readable', function(){
				for(var s; null !== (s=this.read());) data += s;
			});
			clientReadableSide.on('end', function(){
				assert.strictEqual(data, 'Content\r\n');
				done();
			});
		});
		it('addTrailers()');
		it('pipe()', function(done){
			serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
			serverWritableSide.end('Content\r\n');

			const pipe = lib.makeResponsePair();
			clientReadableSide.pipe(pipe.serverWritableSide);

			var data = '';
			pipe.clientReadableSide.setEncoding('UTF-8');
			pipe.clientReadableSide.on('headers', function(){
				assert.strictEqual(pipe.clientReadableSide, this);
				assert.strictEqual(this.statusCode, 400);
				assert.strictEqual(this.statusMessage, 'Message');
				assert.strictEqual(this.headers['allow'], 'GET, HEAD, POST');
			});
			pipe.clientReadableSide.on('readable', function(){
				assert.strictEqual(pipe.clientReadableSide, this);
				for(var s; null !== (s=this.read());) data += s;
			});
			pipe.clientReadableSide.on('end', function(){
				assert.strictEqual(pipe.clientReadableSide, this);
				assert.strictEqual(this.statusCode, 400);
				assert.strictEqual(this.statusMessage, 'Message');
				assert.strictEqual(this.headers['allow'], 'GET, HEAD, POST');
				assert.strictEqual(data, 'Content\r\n');
				done();
			});
		});
	});
	describe('IncomingMessage API', function(){
		var pair, serverWritableSide, clientReadableSide;
		beforeEach(function(){
			pair = lib.makeResponsePair();
			serverWritableSide = pair.serverWritableSide;
			clientReadableSide = pair.clientReadableSide;
			serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
			serverWritableSide.end('Content\r\n');
		});
		// it('clientReadableSide instanceof IncomingMessage', function(){
		// 	assert(clientReadableSide instanceof http.IncomingMessage);
		// });
		it('rawTrailers');
		it('trailers');
		it('statusCode', function(){
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.statusCode, 400);
			});
		});
		it('statusMessage', function(){
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.statusMessage, 'Message');
			});
		});
		it('url', function(){
			return clientReadableSide.ready.then(function(){
				assert.strictEqual(clientReadableSide.url, '');
			});
		});
		it('httpVersion');
		it('headers', function(){
			return clientReadableSide.ready.then(function(){
				assert.deepStrictEqual(clientReadableSide.headers, {allow: 'GET, HEAD, POST'});
			});
		});
		it('complete');
		it('aborted');
		it('setTimeout(msecs, callback)');
		it('destroy(error)');
	});
});
