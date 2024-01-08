//@ts-check
'use strict'

import { Style } from '../core/Style.js'
import { randomNormal } from 'd3-random'
import { checkWebGLSupport, makeWebGLCanvas } from '../utils/webGLUtils.js'
import { WebGLSquareColoring } from '../utils/WebGLSquareColoring.js'
import { color } from 'd3-color'

/**
 *
 * @module style
 * @author Julien Gaffuri
 */
export class DotDensityStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the number of dots for a cell value.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.dotNumber = opts.dotNumber || ((cell, resolution) => resolution / 100)//(c,r,z,vs) => {}

        /** The color of the dots. Same color for all dots within a cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.color = opts.color || (() => '#FF5733') //(c,r,z,vs) => {}

        /** A function returning the size of the dots, in geo unit. Same size for all cells.
         * @type {function(number, number,object):number} */
        this.dotSize = opts.dotSize || ((resolution, z) => 1.5 * z) //(c,r,z,vs) => {}

        /** A function returning the sigma of the dots distribution. Same value for all cells.
         * @type {function(number, number,object):number} */
        this.sigma = opts.sigma || ((resolution, z) => resolution / 2)//(c,r,z,vs) => {}
    }

    /**
     * Draw cells as text.
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

        //get size
        const sGeo = this.dotSize ? this.dotSize(resolution, z, viewScale) : z

        //make random function
        const sig = this.sigma ? this.sigma(resolution, z, viewScale) : resolution * 0.4
        const rand = randomNormal(0, sig)

        if (checkWebGLSupport()) {
            //create canvas and webgl renderer
            const cvWGL = makeWebGLCanvas(geoCanvas.w + '', geoCanvas.h + '')
            if (!cvWGL) {
                console.error('No webGL')
                return
            }

            //create webGL program
            const prog = new WebGLSquareColoring(cvWGL.gl, sGeo / z)

            const r2 = resolution / 2

            for (let cell of cells) {
                //get color
                const col = this.color(cell, resolution, z, viewScale)
                if (!col || col === 'none') continue

                //number of dots
                const dotNumber = this.dotNumber(cell, resolution, z, viewScale)

                //get offset
                const offset = this.offset(cell, resolution, z)

                //cell center
                const cx = cell.x + offset.dx + r2
                const cy = cell.y + offset.dy + r2

                //convert color
                const cc = color(col)
                if (!cc) return

                //random points
                for (let i = 0; i <= dotNumber; i++)
                    prog.addPointData2(cx + rand(), cy + rand(), cc.r, cc.g, cc.b, cc.opacity)
            }

            //draw
            prog.draw(geoCanvas.getWebGLTransform())

            //draw in canvas geo
            geoCanvas.initCanvasTransform()
            geoCanvas.ctx.drawImage(cvWGL.canvas, 0, 0)

        } else {
            for (let cell of cells) {

                //get color
                const col = this.color(cell, resolution, z, viewScale)
                if (!col || col === 'none') continue
                //set color
                geoCanvas.ctx.fillStyle = col

                //number of dots
                const dotNumber = this.dotNumber(cell, resolution, z, viewScale)

                //get offset
                const offset = this.offset(cell, resolution, z)

                //draw random dots
                const cx = cell.x + offset.dx + resolution / 2,
                    cy = cell.y + offset.dy + resolution / 2
                for (let i = 0; i <= dotNumber; i++) {
                    geoCanvas.ctx.fillRect(cx + rand(), cy + rand(), sGeo, sGeo)
                }
            }
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}
