[![Build Status](https://travis-ci.org/tmont/mesia.png)](https://travis-ci.org/tmont/mesia)

A collection of commonly-used utilities for web apps built with one or more of:

- [Sahara](https://github.com/tmont/sahara)
- [Goa](https://github.com/tmont/goa)
- [Express](https://github.com/visionmedia/express)
- [Jade](https://github.com/visionmedia/jade)
- [Winston](https://github.com/flatiron/winston)
- [Less](http://lesscss.org/)
- [Redis](http://redis.io/)
- [Memcached](http://memcached.org/)
- some sort of SQL database

Basically I was copypasting a lot of code around for every new node app I created,
so this is a small collection of things I personally use.

This isn't published to NPM, and there's no documentation, but to use this
library add a reference to the GitHub tag in your `package.json`'s `dependencies`
dictionary.

e.g.

```javascript
{
	"dependencies": {
		"mesia": "https://github.com/tmont/mesia/archive/0.0.10.tar.gz"
	}
}
```

If you see something you find useful and can't figure out how to use it,
open a Github issue and I'll help you out.
