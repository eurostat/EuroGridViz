//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/** @typedef {{ x:number, y:number, or:"v"|"h", c1:(import('../core/Dataset').Cell)|undefined, c2:(import('../core/Dataset').Cell)|undefined }} Side */

/**
 * @typedef {function(Array.<Side>,number, number):*} SideViewScale */

/**
 * @module style
 * @author Julien Gaffuri
 */
export class SideStyle extends Style {
    /** @param {object} opts */
    constructor(opts = {}) {
        super(opts)

        /** A function returning the color of a cell side.
         * @type {function(Side, number, number, object):string} */
        this.color = opts.color || ((side, resolution, z, sideViewScale) => '#EA6BAC')

        /** A function returning the width of a cell side, in geo unit
         * @type {function(Side, number, number, object):number} */
        this.width = opts.width || ((side, resolution, z, sideViewScale) => resolution / 5)

        /** A function returning the length of a cell side, in geo unit
         * @type {function(Side, number, number, object):number} */
        this.length = opts.length || ((side, resolution, z, sideViewScale) => resolution)
    }

    /**
     * @param {Array.<import("../core/Dataset").Cell>} cells
     * @param {number} resolution
     * @param {import("../core/GeoCanvas").GeoCanvas} geoCanvas
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //
        const z = geoCanvas.view.z

        //build sides

        /**  @type {Array.<Side>} */
        const sides = SideStyle.buildSides(cells, resolution)
        if (sides.length == 0) return

        //get side view scale
        const viewScale = this.viewScale ? this.viewScale(sides, resolution, z) : undefined

        //draw sides

        geoCanvas.ctx.lineCap = 'butt'
        const r2 = resolution * 0.5
        for (let side of sides) {

            //color
            /** @type {string|undefined} */
            const col = this.color ? this.color(side, resolution, z, viewScale) : undefined
            if (!col || col == 'none') continue

            //width
            /** @type {number|undefined} */
            const wG = this.width ? this.width(side, resolution, z, viewScale) : undefined
            if (!wG || wG <= 0) continue

            //length
            /** @type {number|undefined} */
            const lG = this.length ? this.length(side, resolution, z, viewScale) : undefined
            if (!lG || lG <= 0) continue
            const lG2 = lG * 0.5

            //set color and width
            geoCanvas.ctx.strokeStyle = col
            geoCanvas.ctx.lineWidth = wG

            //draw segment with correct orientation
            geoCanvas.ctx.beginPath()
            if (side.or === "v") {
                geoCanvas.ctx.moveTo(side.x, side.y + r2 - lG2)
                geoCanvas.ctx.lineTo(side.x, side.y + r2 + lG2)
            } else {
                geoCanvas.ctx.moveTo(side.x + r2 - lG2, side.y)
                geoCanvas.ctx.lineTo(side.x + r2 + lG2, side.y)
            }
            geoCanvas.ctx.stroke()
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }



    /**
     * 
     * @param {Array.<import('../core/Dataset').Cell>} cells The cells to use to build the sides. The side x,y coordinates are those of the left point for horizontal sides, and of the bottom point for vertical sides.
     * @param {number} resolution The cells resolution
     * @param {boolean} withHorizontal Set to true to build horizontal sides, false otherwise.
     * @param {boolean} withVertical Set to true to build vertical sides, false otherwise.
     * @param {boolean} center Set to true so that the side coordinate are those of its center point rather than its left/bottom point.
     * @returns { Array.<Side> }
     */
    static buildSides(cells, resolution, withHorizontal = true, withVertical = true, center = false) {
        /** @type { Array.<Side> } */
        const sides = []

        const r2 = center ? resolution / 2 : 0

        //make horizontal sides
        //sort cells by x and y
        cells.sort((c1, c2) => (c2.x == c1.x ? c1.y - c2.y : c1.x - c2.x))
        let c1 = cells[0]
        for (let i = 1; i < cells.length; i++) {
            let c2 = cells[i]

            if ((c1.y + resolution == c2.y) && (c1.x == c2.x))
                //cells in same column and touch along horizontal side
                //make shared side
                sides.push({
                    or: 'h',
                    x: c1.x + r2, y: c2.y,
                    c1: c1, c2: c2
                })
            else {
                //cells do not touch along horizontal side
                //make two sides: top one for c1, bottom for c2
                sides.push({
                    or: 'h',
                    x: c1.x + r2, y: c1.y + resolution,
                    c1: c1, c2: undefined
                })
                sides.push({
                    or: 'h',
                    x: c2.x + r2, y: c2.y,
                    c1: undefined, c2: c2
                })
            }

            c1 = c2
        }

        //make vertical sides
        //sort cells by y and x
        cells.sort((c1, c2) => (c2.y == c1.y ? c1.x - c2.x : c1.y - c2.y))
        c1 = cells[0]
        for (let i = 1; i < cells.length; i++) {
            let c2 = cells[i]

            if ((c1.x + resolution == c2.x) && (c1.y == c2.y))
                //cells in same row and touch along vertical side
                //make shared side
                sides.push({
                    or: 'v',
                    x: c1.x + resolution, y: c1.y + r2,
                    c1: c1, c2: c2
                })
            else {
                //cells do not touch along vertical side
                //make two sides: right one for c1, left for c2
                sides.push({
                    or: 'v',
                    x: c1.x + resolution, y: c1.y + r2,
                    c1: c1, c2: undefined
                })
                sides.push({
                    or: 'v',
                    x: c2.x, y: c2.y + r2,
                    c1: undefined, c2: c2
                })
            }

            c1 = c2
        }
        return sides
    }

}
