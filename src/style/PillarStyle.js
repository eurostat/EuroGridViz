//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/**
 * @module style
 * @author Julien Gaffuri
 */
export class PillarStyle extends Style {

    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the height of the line representing a cell, in geo unit
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.height = opts.height

        /** A function returning the color of the line representing a cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.color = opts.color || (() => "#c08c59") //(c,r,z,vs) => {}

        /** A function returning the width of the line representing a cell, in geo unit
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.width = opts.width || ((cell, resolution) => 0.5 * resolution)

        /** A function returning the width of the line representing a cell, in geo unit
         * @type {function(number, number,object):boolean} */
        this.simple = opts.simple || (() => false)

        /** @type {number} */
        this.viewHeightFactor = opts.viewHeightFactor || 1.5
        //0,0 is the center
        /** @type {number} */
        this.viewSX = opts.viewSX == undefined ? 0 : opts.viewSX
        /** @type {number} */
        this.viewSY = opts.viewSY == undefined ? -0.5 : opts.viewSY

        //TODO replace with sun location ?
        /** @type {number} */
        this.shadowDirection =
            opts.shadowDirection == undefined ? (-40.3 * Math.PI) / 180.0 : opts.shadowDirection
        /** @type {number} */
        this.shadowFactor = opts.shadowFactor || 0.3
        /** @type {string} */
        this.shadowColor = opts.shadowColor || '#00000033'

        /** @type {string} */
        this.outlineCol = opts.outlineCol || '#FFFFFF'
        /** @type {number} */
        this.outlineWidthPix = opts.outlineWidthPix == undefined ? 0.5 : opts.outlineWidthPix
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

        //get view center geo position
        const cvx = geoCanvas.view.x + this.viewSX * geoCanvas.w * z
        const cvy = geoCanvas.view.y + this.viewSY * geoCanvas.h * z
        //get view height
        const H = this.viewHeightFactor * (geoCanvas.w + geoCanvas.h) * 0.5 * z

        //sort cells by y and x
        //const distToViewCenter = (c) => { const dx = cvx - c.x, dy = cvy - c.y; return Math.sqrt(dx * dx + dy * dy) }
        cells.sort((c1, c2) => 100000000 * (c2.y - c1.y) + c1.x - c2.x)

        //get simple information
        const simple = this.simple(resolution, z, viewScale)

        geoCanvas.ctx.lineCap = simple ? 'butt' : 'round'

        //draw shadows
        geoCanvas.ctx.strokeStyle = this.shadowColor
        geoCanvas.ctx.fillStyle = this.shadowColor
        for (let cell of cells) {
            //width
            /** @type {number|undefined} */
            const wG = this.width ? this.width(cell, resolution, z, viewScale) : undefined
            if (!wG || wG < 0) continue

            //height
            /** @type {number|undefined} */
            const hG = this.height ? this.height(cell, resolution, z, viewScale) : undefined
            if (!hG || hG < 0) continue

            //get offset
            //TODO use that
            //const offset = this.offset(c, resolution, z)

            //set width
            geoCanvas.ctx.lineWidth = wG

            //compute cell centre postition
            const cx = cell.x + resolution / 2
            const cy = cell.y + resolution / 2
            const ls = hG * this.shadowFactor

            //draw segment
            geoCanvas.ctx.beginPath()
            geoCanvas.ctx.moveTo(cx, cy)
            geoCanvas.ctx.lineTo(cx + ls * Math.cos(this.shadowDirection), cy + ls * Math.sin(this.shadowDirection))
            geoCanvas.ctx.stroke()

            /*
            if (this.simple) {
                //draw base circle
                cg.ctx.beginPath();
                cg.ctx.arc(
                    cx, cy,
                    wG * 0.5,
                    0, 2 * Math.PI, false);
                //cg.ctx.stroke();
                cg.ctx.fill();
            }*/
        }

        //draw pillars
        for (let cell of cells) {
            //color
            /** @type {string|undefined} */
            const col = this.color ? this.color(cell, resolution, z, viewScale) : undefined
            if (!col) continue

            //width
            /** @type {number|undefined} */
            const wG = this.width ? this.width(cell, resolution, z, viewScale) : undefined
            if (!wG || wG < 0) continue

            //height
            /** @type {number|undefined} */
            const hG = this.height ? this.height(cell, resolution, z, viewScale) : undefined
            if (!hG || hG < 0) continue

            //get offset
            //TODO use that
            //const offset = this.offset(c, resolution, z)

            //compute cell centre postition
            const cx = cell.x + resolution / 2
            const cy = cell.y + resolution / 2

            //compute angle
            const dx = cx - cvx,
                dy = cy - cvy
            const a = Math.atan2(dy, dx)
            const D = Math.sqrt(dx * dx + dy * dy)
            const d = (D * hG) / (H - hG)

            if (simple) {
                //draw segment
                geoCanvas.ctx.strokeStyle = col
                geoCanvas.ctx.lineWidth = wG
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(cx, cy)
                geoCanvas.ctx.lineTo(cx + d * Math.cos(a), cy + d * Math.sin(a))
                geoCanvas.ctx.stroke()
            } else {
                //draw background segment
                geoCanvas.ctx.strokeStyle = this.outlineCol
                geoCanvas.ctx.lineWidth = wG + 2 * this.outlineWidthPix * z
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(cx, cy)
                geoCanvas.ctx.lineTo(cx + d * Math.cos(a), cy + d * Math.sin(a))
                geoCanvas.ctx.stroke()

                //draw segment
                geoCanvas.ctx.strokeStyle = col
                geoCanvas.ctx.lineWidth = wG
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(cx, cy)
                geoCanvas.ctx.lineTo(cx + d * Math.cos(a), cy + d * Math.sin(a))
                geoCanvas.ctx.stroke()

                //draw top circle
                geoCanvas.ctx.strokeStyle = this.outlineCol
                //cg.ctx.fillStyle = "#c08c59"
                geoCanvas.ctx.lineWidth = this.outlineWidthPix * z
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.arc(cx + d * Math.cos(a), cy + d * Math.sin(a), wG * 0.5, 0, 2 * Math.PI, false)
                geoCanvas.ctx.stroke()
                //cg.ctx.fill();
            }
        }

        //in case...
        geoCanvas.ctx.lineCap = 'butt'

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}
