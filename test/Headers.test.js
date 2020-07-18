"use strict";

var assert = require('assert');

var { Headers } = require('..');

describe('Headers', function(){
	describe('domain', function(){
		it('new Headers(from)', function(){

		});
		it('pipeHeaders', function(){

		});
		it('getHeader', function(){

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
		it('flushHeaders', function(){

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
		it('getHeaderNames', function(){

		});
		it('getHeaders', function(){

		});
		it('hasHeader', function(){

		});
		it('toString', function(){

		});
	});
});
