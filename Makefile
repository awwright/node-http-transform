
MOCHA=./node_modules/.bin/mocha
ISTANBUL=./node_modules/.bin/nyc

all: coverage

test:
	$(MOCHA)

coverage:
	$(ISTANBUL) --reporter=html $(MOCHA)

clean:
	rm -rf coverage

.PHONY: all test clean
