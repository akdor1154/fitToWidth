#!/bin/sh
VERSION=$(sed -n -E -e 's/"version": "(.+)",/\1/p' manifest.json | tr -d '[:space:]')
ID=$(sed -n -E -e 's/"id": "(.+)"/\1/p' manifest.json | tr -d '[:space:]')

ZIPNAME=${ID}-${VERSION}.xpi

echo "${ZIPNAME}"

zip "${ZIPNAME}" fitToWidth.js run.js manifest.json