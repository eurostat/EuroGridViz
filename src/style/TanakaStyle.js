//@ts-check
'use strict'

import { SideStyle } from './SideStyle.js'
import { SquareColorCatWGLStyle } from './SquareColorCatWGLStyle.js'
import { classifier as clFun, colorClassifier as cclFun } from '../utils/scale.js'

/**
 * @see https://manifold.net/doc/mfd9/example__tanaka_contours.htm
 *
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

        /** @type { function(number, number):number }         */
        opts.width = opts.width || ((resolution, z) => 2 * z)

        //make classifiers
        const classifier = clFun(breaks)
        const colorClassifier = cclFun(breaks, colors)

        const colStyle = new SquareColorCatWGLStyle({ color: (cell) => colorClassifier(value(cell)) })

        const getSideValue = (side) => {
            const cl1 = side.c1 ? classifier(value(side.c1)) : 0
            const cl2 = side.c2 ? classifier(value(side.c2)) : 0
            return cl2 - cl1
        }

        /** The side style, for the shadow effect */
        const sideStyle = new SideStyle({
            /*/white or black, depending on orientation and value
            color: (side) => {
                return "gray"
                const v = getSideValue(side)
                if (v === 0) return
                if (side.or === 'v') return v < 0 ? opts.colorBright : opts.colorDark
                return v < 0 ? opts.colorDark : opts.colorBright
            },
            //width depends on the value, that is the number of classes of difference
            width: (side, resolution, z) => {
                return 2*z
                const minWG = 1.5 * z
                const maxWG = 4 * z
                const step = (maxWG / minWG) / 4
                const v = Math.abs(getSideValue(side))
                return Math.min(minWG + (v - 1) * step, maxWG)

            }*/
        })

        return [colStyle, sideStyle]
    }
}
