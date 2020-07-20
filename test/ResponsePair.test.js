"use strict";

const assert = require('assert');
const stream = require('stream');
const http = require('http');

const { ResponsePair } = require('..');

describe('ResponsePair', function(){
	describe('reading headers early produces error', function(){
		var headers;
		beforeEach(function(){
			const { serverWritableSide, clientReadableSide } = new ResponsePair();
			serverWritableSide.addHeader('Link', '<http://localhost/>;rel=up');
			headers = clientReadableSide;
		});
		it.skip('rawHeaders', function(){
			assert.throws(function(){
				return headers.rawHeaders[0];
			}, function(err){
				assert.match(err.toString(), /TypeError/);
				return true;
			});
		});
		it.skip('headers', function(){
			assert.throws(function(){
				return headers.headers['Link'];
			}, function(err){
				assert.match(err.toString(), /TypeError/);
				return true;
			});
		});
		it('hasHeader', function(){
			assert.throws(function(){
				return headers.hasHeader('Link');
			}, function(err){
				assert.match(err.toString(), /Headers not yet received/);
				return true;
			});
		});
		it('getHeader', function(){
			assert.throws(function(){
				return headers.getHeader('Link');
			}, function(err){
				assert.match(err.toString(), /Headers not yet received/);
				return true;
			});
		});
		it('getHeaders', function(){
			assert.throws(function(){
				return headers.getHeaders('Link');
			}, function(err){
				assert.match(err.toString(), /Headers not yet received/);
				return true;
			});
		});
		it('getHeaderNames', function(){
			assert.throws(function(){
				return headers.getHeaderNames('Link');
			}, function(err){
				assert.match(err.toString(), /Headers not yet received/);
				return true;
			});
		});
	});
	describe('serverWritableSide', function(){
		describe('WritableSide', function(){
			var serverWritableSide, clientReadableSide;
			beforeEach(function(){
				const pair = new ResponsePair();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
			});
			it('addHeader()', function (){
				serverWritableSide.addHeader('Link', '<http://example.com/>;rel=up');
				serverWritableSide.addHeader('Link', '<http://example.com/page/2>;rel=next');
				serverWritableSide.flushHeaders();
				return clientReadableSide.headersReady.then(function(){
					assert.strictEqual(clientReadableSide.headers['link'][0], '<http://example.com/>;rel=up');
					assert.strictEqual(clientReadableSide.headers['link'][1], '<http://example.com/page/2>;rel=next');
					assert.strictEqual(clientReadableSide.headers['link'].length, 2);
				});
			});
		});
		describe('implements ServerResponse', function(){
			var serverWritableSide, clientReadableSide;
			beforeEach(function(){
				const pair = new ResponsePair();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
			});
			it.skip('serverWritableSide instanceof ServerResponse', function(){
				assert(serverWritableSide instanceof http.ServerResponse);
			});
			it('statusCode', function(){
				serverWritableSide.statusCode = 400;
				serverWritableSide.end();
				return clientReadableSide.headersReady.then(function(){
					assert.strictEqual(clientReadableSide.statusCode, 400);
				});
			});
			it('statusMessage', function(){
				serverWritableSide.statusMessage = 'Custom Message';
				serverWritableSide.end();
				return clientReadableSide.headersReady.then(function(){
					assert.strictEqual(clientReadableSide.statusMessage, 'Custom Message');
				});
			});
			it('writeContinue()');
			it('writeProcessing()');
			it('writeHead(statusCode, statusMessage, headers)', function(){
				serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
				return clientReadableSide.headersReady.then(function(){
					assert.strictEqual(clientReadableSide.statusCode, 400);
					assert.strictEqual(clientReadableSide.statusMessage, 'Message');
					assert.strictEqual(clientReadableSide.headers['allow'], 'GET, HEAD, POST');
				});
			});
		});
		describe('implements OutgoingMessage', function(){
			var serverWritableSide, clientReadableSide;
			beforeEach(function(){
				const pair = new ResponsePair();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
			});
			it.skip('serverWritableSide instanceof OutgoingMessage', function(){
				assert(serverWritableSide instanceof http.OutgoingMessage);
			});
			it('setHeader(name, value)', function(){
				serverWritableSide.setHeader('Allow', 'GET, HEAD, POST');
				serverWritableSide.end();
				return clientReadableSide.headersReady.then(function(){
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
				return clientReadableSide.headersReady.then(function(){
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
		});
	});
	describe('clientReadableSide', function(){
		describe('ReadableSide', function(){
			var serverWritableSide, clientReadableSide;
			beforeEach(function(){
				const pair = new ResponsePair();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
				serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
				serverWritableSide.end('Content\r\n');
			});
			it('pipeHeaders()', function(done){
				const through = new ResponsePair();
				clientReadableSide.pipeMessage(through.serverWritableSide);
				through.clientReadableSide.setEncoding('UTF-8');
				through.clientReadableSide.on('headers', function(){
					assert(through.clientReadableSide === this);
					assert.strictEqual(this.statusCode, 400);
					assert.strictEqual(this.statusMessage, 'Message');
					assert.strictEqual(this.headers['allow'], 'GET, HEAD, POST');
					done();
				});
			});
			it('pipeMessage()', function(done){
				const pipe = new ResponsePair();
				clientReadableSide.pipeMessage(pipe.serverWritableSide);

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
		describe('implements IncomingMessage', function(){
			var serverWritableSide, clientReadableSide;
			beforeEach(function(){
				const pair = new ResponsePair();
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
				return clientReadableSide.headersReady.then(function(){
					assert.strictEqual(clientReadableSide.statusCode, 400);
				});
			});
			it('statusMessage', function(){
				return clientReadableSide.headersReady.then(function(){
					assert.strictEqual(clientReadableSide.statusMessage, 'Message');
				});
			});
			it('url', function(){
				return clientReadableSide.headersReady.then(function(){
					assert.strictEqual(clientReadableSide.url, '');
				});
			});
			it('httpVersion');
			it('headers', function(){
				return clientReadableSide.headersReady.then(function(){
					assert.deepStrictEqual(clientReadableSide.headers, {allow: 'GET, HEAD, POST'});
				});
			});
			it('complete');
			it('aborted');
			it('setTimeout(msecs, callback)');
			it('destroy(error)');
		});
		describe('implements Readable', function(){
			it('destroy()');
			it('pipe()');
			it('pause()');
			it('resume()');
		});
	});
});
