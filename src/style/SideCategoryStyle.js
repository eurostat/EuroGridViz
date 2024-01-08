//@ts-check
'use strict'

import { SideStyle } from './SideStyle.js'

/**
 * A style to show the sides of grid cells based on their different categories.
 *
 * @module style
 * @author Julien Gaffuri
 */
export class SideCategoryStyle extends SideStyle {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the category code of a cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number):string} */
        this.code = opts.code

        /**
         * The dictionary (string -> color) which give the color of each category.
         * @type {object} */
        this.color = opts.color

    }

    /**
     * @param {Array.<import("../core/Dataset.js").Cell>} cells
     * @param {import("../core/GeoCanvas.js").GeoCanvas} geoCanvas
     * @param {number} resolution
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //
        const z = geoCanvas.view.z

        //build sides

        /**  @type {Array.<import('./SideStyle.js').Side>} */
        const sides = SideStyle.buildSides(cells, resolution)
        if (sides.length == 0) return

        //get side view scale
        const viewScale = this.viewScale ? this.viewScale(sides, resolution, z) : undefined

        //draw sides

        geoCanvas.ctx.lineCap = 'butt'
        for (let side of sides) {

            //get category codes for both cells
            const code1 = side.c1 ? this.code(side.c1, resolution, z) : undefined
            const code2 = side.c2 ? this.code(side.c2, resolution, z) : undefined
            if (code1 == code2) continue

            //width
            /** @type {number|undefined} */
            const wG = this.width ? this.width(side, resolution, z, viewScale) : undefined
            if (!wG || wG <= 0) continue
            const w2 = wG * 0.5

            //set width
            geoCanvas.ctx.lineWidth = wG

            //draw segment with correct orientation
            if (side.or === 'h') {
                //top line
                if (code2) {
                    geoCanvas.ctx.beginPath()
                    geoCanvas.ctx.strokeStyle = this.color[code2]
                    geoCanvas.ctx.moveTo(side.x, side.y + w2)
                    geoCanvas.ctx.lineTo(side.x + resolution, side.y + w2)
                    geoCanvas.ctx.stroke()
                }

                //bottom line
                if (code1) {
                    geoCanvas.ctx.beginPath()
                    geoCanvas.ctx.strokeStyle = this.color[code1]
                    geoCanvas.ctx.moveTo(side.x, side.y - w2)
                    geoCanvas.ctx.lineTo(side.x + resolution, side.y - w2)
                    geoCanvas.ctx.stroke()
                }
            } else {
                //right line
                if (code2) {
                    geoCanvas.ctx.beginPath()
                    geoCanvas.ctx.strokeStyle = this.color[code2]
                    geoCanvas.ctx.moveTo(side.x + w2, side.y)
                    geoCanvas.ctx.lineTo(side.x + w2, side.y + resolution)
                    geoCanvas.ctx.stroke()
                }

                //left line
                if (code1) {
                    geoCanvas.ctx.beginPath()
                    geoCanvas.ctx.strokeStyle = this.color[code1]
                    geoCanvas.ctx.moveTo(side.x - w2, side.y)
                    geoCanvas.ctx.lineTo(side.x - w2, side.y + resolution)
                    geoCanvas.ctx.stroke()
                }
            }
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}
