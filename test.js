'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const fitToWidthPath = require.resolve('./fitToWidth')
const fitToWidthScript = fs.readFileSync(fitToWidthPath);
const fitToWidth = {};
vm.runInNewContext(fitToWidthScript, fitToWidth, {
    filename: path.basename(fitToWidthPath),
    strict: true
});

const assert = require('assert');

describe('fitToWidth', () => {

    describe('coordinates', () => {
        it('should work', () => {
            const minX = 0; const maxX = 1; const numX = 6;
            const minY = 2; const maxY = 4; const numY = 3;

            const coordinates = Array.from(fitToWidth.coordinates({
                minX, maxX, numX, minY, maxY, numY
            }));

            assert.deepEqual(coordinates, [
                [0, 2], [0.2, 2], [0.4, 2], [0.6, 2], [0.8, 2], [1, 2],
                [0, 3], [0.2, 3], [0.4, 3], [0.6, 3], [0.8, 3], [1, 3],
                [0, 4], [0.2, 4], [0.4, 4], [0.6, 4], [0.8, 4], [1, 4],
            ])

        })
    });

    describe('get most common', () => {
        it('should work with NaN', () => {
            const test = [
                1,
                'asdf',
                NaN,
                1,
                NaN,
                NaN
            ];

            assert(Object.is(fitToWidth.getMostCommon(test), NaN));
        });

        it('should work with more ordinary values', () => {
            const test = [
                1,
                4,
                6,
                2,
                2,
                1,
                4,
                4,
                4,
                4,
                6
            ];

            assert.deepStrictEqual(fitToWidth.getMostCommon(test), 4);
        });
    });

});