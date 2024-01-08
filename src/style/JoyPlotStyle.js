//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/**
 * @module style
 * @author Julien Gaffuri
 */
export class JoyPlotStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the height of a cell in geographical unit.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.height = opts.height || ((c, r) => r * Math.random()) //(c,r,z,vs) => {}

        /**
         * @type {function(number,{min:number, max:number},number,number):string} */
        this.lineColor = opts.lineColor || ((y, ys, r, z) => '#BBB')
        /**
         * @type {function(number,{min:number, max:number},number,number):number} */
        this.lineWidth = opts.lineWidth || ((y, ys, r, z) => z)
        /**
         * @type {function(number,{min:number, max:number},number,number):string} */
        this.fillColor = opts.fillColor || ((y, ys, r, z) => '#c08c5968')
    }


    /**
     * @param {Array.<import("../core/Dataset.js").Cell>} cells
     * @param {import("../core/GeoCanvas.js").GeoCanvas} geoCanvas
     * @param {number} resolution
     * @override
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //
        const z = geoCanvas.view.z

        //get view scale
        const viewScale = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        //index cells by y and x
        /**  @type {object} */
        const ind = {}
        for (const cell of cells) {
            let row = ind[cell.y]
            if (!row) {
                row = {}
                ind[cell.y] = row
            }
            row[cell.x] = this.height(cell, resolution, z, viewScale)
        }

        //compute extent
        const e = geoCanvas.extGeo
        if (!e) return
        const xMin = Math.floor(e.xMin / resolution) * resolution
        const xMax = Math.floor(e.xMax / resolution) * resolution
        const yMin = Math.floor(e.yMin / resolution) * resolution
        const yMax = Math.floor(e.yMax / resolution) * resolution

        /**  @type {{min:number, max:number}} */
        const ys = { min: yMin, max: yMax }

        //draw lines, row by row, stating from the top
        geoCanvas.ctx.lineJoin = 'round'
        for (let y = yMax; y >= yMin; y -= resolution) {
            //get row
            const row = ind[y]

            //no row
            if (!row) continue

            //place first point
            geoCanvas.ctx.beginPath()
            geoCanvas.ctx.moveTo(xMin - resolution / 2, y)

            //store the previous height
            /** @type {number|undefined} */
            let hG_

            //go through the line cells
            for (let x = xMin; x <= xMax; x += resolution) {
                //get column value
                /** @type {number} */
                let hG = row[x]
                if (!hG) hG = 0

                if (hG || hG_) {
                    //draw line only when at least one of both values is non-null
                    //TODO test bezierCurveTo
                    geoCanvas.ctx.lineTo(x + resolution / 2, y + hG)
                } else {
                    //else move the point
                    geoCanvas.ctx.moveTo(x + resolution / 2, y)
                }
                //store the previous value
                hG_ = hG
            }

            //last point
            if (hG_) geoCanvas.ctx.lineTo(xMax + resolution / 2, y)

            //draw fill
            const fc = this.fillColor(y, ys, resolution, z)
            if (fc && fc != 'none') {
                geoCanvas.ctx.fillStyle = fc
                geoCanvas.ctx.fill()
            }

            //draw line
            const lc = this.lineColor(y, ys, resolution, z)
            const lw = this.lineWidth(y, ys, resolution, z)
            if (lc && lc != 'none' && lw > 0) {
                geoCanvas.ctx.strokeStyle = lc
                geoCanvas.ctx.lineWidth = lw
                geoCanvas.ctx.stroke()
            }
        }
    }
}
