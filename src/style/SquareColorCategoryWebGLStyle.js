//@ts-check
'use strict'

import { Style } from '../core/Style.js'
import { makeWebGLCanvas } from '../utils/webGLUtils.js'
import { WebGLSquareColoringCatAdvanced } from '../utils/WebGLSquareColoringCatAdvanced.js'

/**
 * Style based on webGL
 * To show cells as colored squares, from categories.
 * All cells are drawn as squares, with the same size
 *
 * @module style
 * @author Julien Gaffuri
 */
export class SquareColorCategoryWebGLStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /**
         * The name of the column/attribute of the tabular data where to retrieve the category code of the cell, for coloring.
         * @type {string} */
        this.code = opts.code

        /**
         * The dictionary (code -> color) which gives the color of each category code.
         * @type {object} */
        opts.color = opts.color || undefined

        /** @type { Array.<string> } */
        const codes = Object.keys(opts.color)

        /** @type { object } @private */
        this.catToI = {}
        for (let i = 0; i < codes.length; i++) this.catToI[codes[i]] = i + ''

        /** @type { Array.<string> } @private */
        this.colors = []
        for (const code of codes)
            this.colors.push(opts.color['' + code])

        /**
         * A function returning the size of the cells, in geographical unit. All cells have the same size.
         * @type {function(number,number):number} */
        this.size = opts.size // (resolution, z) => ...

        /**
         * @private
         * @type { WebGLSquareColoringCatAdvanced } */
        this.wgp = new WebGLSquareColoringCatAdvanced(this.colors)
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

        //add vertice and fragment data
        const r2 = resolution / 2
        let c, nb = cells.length
        const verticesBuffer = []
        const iBuffer = []
        for (let i = 0; i < nb; i++) {
            c = cells[i]
            const cat = c[this.code]
            if (cat == undefined) {
                console.log('Unexpected category: ' + cat)
                continue
            }
            /** @type {number} */
            const i_ = this.catToI[cat]
            if (isNaN(+i_)) {
                console.log('Unexpected category index: ' + cat + ' ' + i_)
                continue
            }
            verticesBuffer.push(c.x + r2, c.y + r2)
            iBuffer.push(+i_)
        }

        //create canvas and webgl renderer
        const cvWGL = makeWebGLCanvas(geoCanvas.w + '', geoCanvas.h + '')
        if (!cvWGL) {
            console.error('No webGL')
            return
        }

        //draw
        const sizeGeo = this.size ? this.size(resolution, z) : resolution + 0.2 * z
        this.wgp.draw(cvWGL.gl, verticesBuffer, iBuffer, geoCanvas.getWebGLTransform(), sizeGeo / z)

        //draw in canvas geo
        geoCanvas.initCanvasTransform()
        geoCanvas.ctx.drawImage(cvWGL.canvas, 0, 0)

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z })
    }
}