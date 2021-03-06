"use strict";

var assert = require('assert');

var { Headers } = require('..');

describe('Headers', function(){
	describe('domain', function(){
		it('new Headers (object form)', function(){
			assert.throws(function(){
				new Headers({
					statusCode: 405,
					statusMessage: 'Method Not Allowed',
					headers: { ' Allow': 'GET, POST' },
				});
			}, function(err){
				assert.match(err.toString(), /Header name must be a valid HTTP token/);
				assert.strictEqual(err.code, 'ERR_INVALID_HTTP_TOKEN');
				return true;
			});
		});
		it('new Headers (array form)', function(){
			assert.throws(function(){
				new Headers({
					statusCode: 405,
					statusMessage: 'Method Not Allowed',
					headers: [ [' Allow', 'GET, POST'] ],
				});
			}, function(err){
				assert.match(err.toString(), /Header name must be a valid HTTP token/);
				assert.strictEqual(err.code, 'ERR_INVALID_HTTP_TOKEN');
				return true;
			});
		});
		it('new Headers (rawHeaders form)', function(){
			assert.throws(function(){
				new Headers({
					statusCode: 405,
					statusMessage: 'Method Not Allowed',
					rawHeaders: [' Allow', 'GET, POST'],
				});
				}, function(err){
				assert.match(err.toString(), /Header name must be a valid HTTP token/);
				assert.strictEqual(err.code, 'ERR_INVALID_HTTP_TOKEN');
				return true;
			});
		});
		it('writeHead', function(){
			const headers = new Headers;
			assert.throws(function(){
				headers.writeHead(405, 'Method Not Allowed', {
					' Allow': 'GET, POST',
				});
			}, function(err){
				assert.match(err.toString(), /Header name must be a valid HTTP token/);
				assert.strictEqual(err.code, 'ERR_INVALID_HTTP_TOKEN');
				return true;
			});
		});
		it('setHeader', function(){
			const headers = new Headers;
			assert.throws(function(){
				headers.setHeader(' Allow', 'GET, POST');
			}, function(err){
				assert.match(err.toString(), /Header name must be a valid HTTP token/);
				assert.strictEqual(err.code, 'ERR_INVALID_HTTP_TOKEN');
				return true;
			});
		});
		it('addHeader', function(){
			const headers = new Headers;
			assert.throws(function(){
				headers.addHeader(' Allow', 'GET, POST');
			}, function(err){
				assert.match(err.toString(), /Header name must be a valid HTTP token/);
				assert.strictEqual(err.code, 'ERR_INVALID_HTTP_TOKEN');
				return true;
			});
		});
		it('removeHeader', function(){
			const headers = new Headers;
			headers.addHeader('Allow', 'GET, POST');
			assert.throws(function(){
				headers.removeHeader(' Allow');
			}, function(err){
				assert.match(err.toString(), /Header name must be a valid HTTP token/);
				assert.strictEqual(err.code, 'ERR_INVALID_HTTP_TOKEN');
				return true;
			});
		});
	});
	describe('interface', function(){
		it('new Headers({path}', function(){
			const headers = new Headers({
				method: 'POST',
				path: '/foo',
			});
			headers.flushHeaders();
			assert(headers.url, '/foo');
			assert(headers.target, '/foo');
			assert(headers.method, 'POST');
		});
		it('new Headers({target}', function(){
			const headers = new Headers({
				method: 'POST',
				target: '/foo',
			});
			headers.flushHeaders();
			assert(headers.url, '/foo');
			assert(headers.target, '/foo');
			assert(headers.method, 'POST');
		});
		describe('removeHeader', function(){
			var headers;
			beforeEach(function(){
				headers = new Headers({
					headers: [
						['ETag', '"0"'],
						['link', '<http://example.com/0>'],
						['link', '<http://example.com/1>'],
						['Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT'],
						['Link', '<http://example.com/2>'],
						['LINK', '<http://example.com/3>'],
						['LINK', '<http://example.com/4>'],
						['Content-Type', 'text/plain'],
					],
				});
			});
			it('removeHeader (0)', function(){
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"0"',
					'link', '<http://example.com/0>',
					'link', '<http://example.com/1>',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Link', '<http://example.com/2>',
					'LINK', '<http://example.com/3>',
					'LINK', '<http://example.com/4>',
					'Content-Type', 'text/plain',
				]);
			});
			it('removeHeader (1)', function(){
				headers.removeHeader('ETag');
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'link', '<http://example.com/0>',
					'link', '<http://example.com/1>',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Link', '<http://example.com/2>',
					'LINK', '<http://example.com/3>',
					'LINK', '<http://example.com/4>',
					'Content-Type', 'text/plain',
				]);
			});
			it('removeHeader (2)', function(){
				headers.removeHeader('Link');
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"0"',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Content-Type', 'text/plain',
				]);
			});
			it('removeHeader (3)', function(){
				headers.removeHeader('Last-Modified');
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"0"',
					'link', '<http://example.com/0>',
					'link', '<http://example.com/1>',
					'Link', '<http://example.com/2>',
					'LINK', '<http://example.com/3>',
					'LINK', '<http://example.com/4>',
					'Content-Type', 'text/plain',
				]);
			});
			it('removeHeader (4)', function(){
				headers.removeHeader('Content-Type');
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"0"',
					'link', '<http://example.com/0>',
					'link', '<http://example.com/1>',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Link', '<http://example.com/2>',
					'LINK', '<http://example.com/3>',
					'LINK', '<http://example.com/4>',
				]);
			});
			it('removeHeader (3)', function(){
				headers.removeHeader('Foo');
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"0"',
					'link', '<http://example.com/0>',
					'link', '<http://example.com/1>',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Link', '<http://example.com/2>',
					'LINK', '<http://example.com/3>',
					'LINK', '<http://example.com/4>',
					'Content-Type', 'text/plain',
				]);
			});
			it('setHeader (0)', function(){
				headers.setHeader('Foo', 'bar');
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"0"',
					'link', '<http://example.com/0>',
					'link', '<http://example.com/1>',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Link', '<http://example.com/2>',
					'LINK', '<http://example.com/3>',
					'LINK', '<http://example.com/4>',
					'Content-Type', 'text/plain',
					'Foo', 'bar',
				]);
			});
			it('setHeader (1)', function(){
				headers.setHeader('ETag', '"1"');
				headers.flushHeaders();
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"1"',
					'link', '<http://example.com/0>',
					'link', '<http://example.com/1>',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Link', '<http://example.com/2>',
					'LINK', '<http://example.com/3>',
					'LINK', '<http://example.com/4>',
					'Content-Type', 'text/plain',
				]);
			});
			it('setHeader (1)', function(){
				headers.setHeader('Link', '<http://example.com/0>');
				headers.flushHeaders();
				// These may be rearranged if necessary
				assert.deepStrictEqual(headers.rawHeaders, [
					'ETag', '"0"',
					'Last-Modified', 'Mon, 27 Jul 2020 00:55:47 GMT',
					'Content-Type', 'text/plain',
					'Link', '<http://example.com/0>',
				]);
			});
		});
	});
	describe('cannot write headers after sent', function(){
		var headers;
		beforeEach(function(){
			headers = new Headers;
			headers.addHeader('Link', '<http://localhost/>;rel=up');
			headers.flushHeaders();
		});
		it('writeHead', function(){
			assert.throws(function(){
				headers.writeHead(405, 'Method Not Allowed', {
					'Allow': 'GET, POST',
				});
			}, function(err){
				assert.match(err.toString(), /Cannot set headers after they are sent to the client/);
				assert.strictEqual(err.code, 'ERR_HTTP_HEADERS_SENT');
				return true;
			});
		});
		it('flushHeaders', function(){
			assert.throws(function(){
				headers.flushHeaders();
			}, function(err){
				assert.match(err.toString(), /Cannot set headers after they are sent to the client/);
				assert.strictEqual(err.code, 'ERR_HTTP_HEADERS_SENT');
				return true;
			});
		});
		it('setHeader', function(){
			assert.throws(function(){
				headers.setHeader('Allow', 'GET, POST');
			}, function(err){
				assert.match(err.toString(), /Cannot set headers after they are sent to the client/);
				assert.strictEqual(err.code, 'ERR_HTTP_HEADERS_SENT');
				return true;
			});
		});
		it('addHeader', function(){
			assert.throws(function(){
				headers.addHeader('Allow', 'GET, POST');
			}, function(err){
				assert.match(err.toString(), /Cannot set headers after they are sent to the client/);
				assert.strictEqual(err.code, 'ERR_HTTP_HEADERS_SENT');
				return true;
			});
		});
		it('removeHeader', function(){
			assert.throws(function(){
				headers.removeHeader('Allow');
			}, function(err){
				assert.match(err.toString(), /Cannot set headers after they are sent to the client/);
				assert.strictEqual(err.code, 'ERR_HTTP_HEADERS_SENT');
				return true;
			});
		});
	});
});
