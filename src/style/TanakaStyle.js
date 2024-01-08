//@ts-check
'use strict'

import { SideStyle } from './SideStyle.js'
import { SquareColorCategoryWebGLStyle } from './SquareColorCategoryWebGLStyle.js'
import { classifier as clFun, colorClassifier as cclFun } from '../utils/scale.js'

/**
 * @see https://manifold.net/doc/mfd9/example__tanaka_contours.htm
 *
 * @module style
 * @author Julien Gaffuri
 */
export class TanakaStyle {
    /**
     * @param {function(import('../core/Dataset.js').Cell):number} value Function that returns the value of a cell
     * @param {Array.<number>} breaks The break values
     * @param {Array.<string>} colors The colors, one more than the break values
     * @param {object} opts
     * @returns {Array.<import("../core/Style").Style>}
     */
    static get(value, breaks, colors, opts = {}) {

        //shadow colors
        opts.colorDark = opts.colorDark || '#111'
        opts.colorBright = opts.colorBright || '#ddd'

        /** @type { function(number, number):number } */
        opts.width = opts.width || ((sideValue, resolution, z) => {
            const minWG = 1 * z
            const maxWG = 4 * z
            const step = (maxWG - minWG) / 3
            return Math.min(minWG + (sideValue - 1) * step, maxWG)
        })

        //make classifiers
        const classifier = clFun(breaks)
        const colorClassifier = cclFun(breaks, colors)

        const cellStyle = new SquareColorCategoryWebGLStyle({ color: (cell) => colorClassifier(value(cell)) })

        const getSideValue = (side) => {
            const cl1 = side.c1 ? classifier(value(side.c1)) : 0
            const cl2 = side.c2 ? classifier(value(side.c2)) : 0
            return cl1 - cl2
        }

        /** The side style, for the shadow effect */
        const sideStyle = new SideStyle({
            //white or black, depending on orientation and value
            color: (side) => {
                const v = getSideValue(side)
                if (v === 0) return
                if (side.or === 'v') return v < 0 ? opts.colorBright : opts.colorDark
                return v < 0 ? opts.colorDark : opts.colorBright
            },
            //width depends on the value, that is the number of classes of difference
            width: (side, resolution, z) => opts.width(Math.abs(getSideValue(side)), resolution, z)
        })

        return [cellStyle, sideStyle]
    }
}
