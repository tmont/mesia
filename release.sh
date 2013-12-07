#!/bin/bash

version=`node -e "var pkg = require('./package.json'); \
pkg.version = pkg.version.replace(/(-?\d+)$/, function(_, number) { return Number(number) + 1; });\
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, '\t'));\
console.log(pkg.version);"`

git commit -a -m "release ${version}"
git tag -a "${version}" -m "${version}"
git push && git push --tags
