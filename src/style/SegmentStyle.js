//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/**
 * A style where each cell is represented by a segment whose length, width, color and orientation can vary according to statistical values.
 *
 * @module style
 * @author Julien Gaffuri
 */
export class SegmentStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the color of the cell segment.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.color = opts.color || (() => "#EA6BAC") //(c,r,z,vs) => {}

        /** A function returning the width of the segment representing a cell, in geo unit
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.width = opts.width || ((cell, resolution) => resolution * 0.1)  //(c,r,z,vs) => {}

        /** A function returning the length of the segment representing a cell, in geo unit
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.length = opts.length || ((cell, resolution) => resolution * 0.9)  //(c,r,z,vs) => {}

        /** A function returning the orientation (in degrees) of the segment representing a cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.orientation = opts.orientation || (() => 180 * Math.random()) //(c,r,z,vs) => {}
    }

    /**
     * Draw cells as segments.
     *
     * @param {Array.<import("../core/Dataset").Cell>} cells
     * @param {import("../core/GeoCanvas").GeoCanvas} geoCanvas
     * @param {number} resolution
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //
        const z = geoCanvas.view.z

        //get view scale
        const viewScale = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        //
        geoCanvas.ctx.lineCap = 'butt'

        //conversion factor degree -> radian
        const f = Math.PI / 180

        for (let cell of cells) {
            //color
            /** @type {string|undefined} */
            const col = this.color ? this.color(cell, resolution, z, viewScale) : undefined
            if (!col) continue

            //width
            /** @type {number|undefined} */
            const wG = this.width ? this.width(cell, resolution, z, viewScale) : undefined
            if (!wG || wG < 0) continue

            //length
            /** @type {number|undefined} */
            const lG = this.length ? this.length(cell, resolution, z, viewScale) : undefined
            if (!lG || lG < 0) continue

            //orientation (in radian)
            /** @type {number} */
            const or = this.orientation(cell, resolution, z, viewScale) * f
            if (or === undefined || isNaN(or)) continue

            //get offset
            const offset = this.offset(cell, resolution, z)

            //set color and width
            geoCanvas.ctx.strokeStyle = col
            geoCanvas.ctx.lineWidth = wG

            //compute segment centre postition
            const cx = cell.x + resolution / 2 + offset.dx
            const cy = cell.y + resolution / 2 + offset.dy

            //compute segment direction
            const dx = 0.5 * Math.cos(or) * lG
            const dy = 0.5 * Math.sin(or) * lG

            //draw segment
            geoCanvas.ctx.beginPath()
            geoCanvas.ctx.moveTo(cx - dx, cy - dy)
            geoCanvas.ctx.lineTo(cx + dx, cy + dy)
            geoCanvas.ctx.stroke()
        }

        //update legends
        this.updateLegends({ viewScale: viewScale, resolution: resolution, z: z, cells: cells })
    }
}
