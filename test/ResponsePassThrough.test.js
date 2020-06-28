"use strict";

const assert = require('assert');
const stream = require('stream');
const http = require('http');

const { ResponsePassThrough } = require('..');

describe('ResponsePassThrough', function(){
	describe('serverWritableSide', function(){
		describe('WritableSide', function(){
			var pair, serverWritableSide, clientReadableSide;
			beforeEach(function(){
				pair = new ResponsePassThrough();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
			});
			it.skip('addHeader()');
		});
		describe('implements ServerResponse', function(){
			var pair, serverWritableSide, clientReadableSide;
			beforeEach(function(){
				pair = new ResponsePassThrough();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
			});
			it('serverWritableSide instanceof ServerResponse', function(){
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
			var pair, serverWritableSide, clientReadableSide;
			beforeEach(function(){
				pair = new ResponsePassThrough();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
			});
			it('serverWritableSide instanceof OutgoingMessage', function(){
				assert(serverWritableSide instanceof http.OutgoingMessage);
			});
			// For some reason an OutgoingMessage isn't a Writable in Node.js ?!?
			// it('serverWritableSide instanceof Writable', function(){
			// 	assert(serverWritableSide instanceof stream.Writable);
			// });
			it('serverWritableSide instanceof Stream', function(){
				assert(serverWritableSide instanceof stream.Stream);
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
			it('pipe()', function(done){
				serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
				serverWritableSide.end('Content\r\n');

				const through = new ResponsePassThrough();
				clientReadableSide.pipe(through.serverWritableSide);

				var data = '';
				through.clientReadableSide.setEncoding('UTF-8');
				through.clientReadableSide.on('headers', function(){
					assert(through.clientReadableSide === this);
					assert.strictEqual(this.statusCode, 400);
					assert.strictEqual(this.statusMessage, 'Message');
					assert.strictEqual(this.headers['allow'], 'GET, HEAD, POST');
				});
				through.clientReadableSide.on('readable', function(){
					assert(through.clientReadableSide === this);
					for(var s; null !== (s=this.read());) data += s;
				});
				through.clientReadableSide.on('end', function(){
					assert(through.clientReadableSide === this);
					assert.strictEqual(this.statusCode, 400);
					assert.strictEqual(this.statusMessage, 'Message');
					assert.strictEqual(this.headers['allow'], 'GET, HEAD, POST');
					assert.strictEqual(data, 'Content\r\n');
					done();
				});
			});
		});
	});
	describe('clientReadableSide', function(){
		describe('ReadableSide', function(){
			var pair, serverWritableSide, clientReadableSide;
			beforeEach(function(){
				pair = new ResponsePassThrough();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
				serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
				serverWritableSide.end('Content\r\n');
			});
			it('pipeHeaders()');
			it('pipeMessage()');
		});
		describe('implements IncomingMessage', function(){
			var pair, serverWritableSide, clientReadableSide;
			beforeEach(function(){
				pair = new ResponsePassThrough();
				serverWritableSide = pair.serverWritableSide;
				clientReadableSide = pair.clientReadableSide;
				serverWritableSide.writeHead(400, 'Message', {Allow: 'GET, HEAD, POST'});
				serverWritableSide.end('Content\r\n');
			});
			it('clientReadableSide instanceof IncomingMessage', function(){
				assert(clientReadableSide instanceof http.IncomingMessage);
			});
			it('clientReadableSide instanceof Readable', function(){
				assert(clientReadableSide instanceof stream.Readable);
			});
			it('clientReadableSide instanceof Stream', function(){
				assert(clientReadableSide instanceof stream.Stream);
			});
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
