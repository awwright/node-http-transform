# http-transform

An extension of the Node.js Transform stream that additionally supports the HTTP header interface.


## API

### ServerResponseTransform

A subclass of the Node.js Transform that also transforms HTTP headers and status code.

### PassThrough

Accepts input and passes it to the write target(s).

This can be used to convert a typical ReadableStream into one that produces HTTP headers.
