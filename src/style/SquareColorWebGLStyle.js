//@ts-check
'use strict'

import { Style } from '../core/Style.js'
import { makeWebGLCanvas } from '../utils/webGLUtils.js'
import { WebGLSquareColoringAdvanced } from '../utils/WebGLSquareColoringAdvanced.js'

/**
 * Style based on webGL
 * To show cells as colored squares, with computation of the colors on GPU side (faster than JavaScript side).
 * Alls squares with the same size
 *
 * @module style
 * @author Julien Gaffuri
 */
export class SquareColorWebGLStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /**
         * A function returning a t value (within [0,1]) for a cell.
         * @type {function(import('../core/Dataset.js').Cell,number,number,object):number} */
        this.tFun = opts.tFun //(c,r,z,vs) => {}

        /**
         * Distribution stretching method.
         * The stretching is performed on GPU side (fragment shader).
         * @type {{ fun:string, alpha:number }} */
        this.stretching = opts.stretching

        /**
         * The sample of the color ramp.
         * The color is computed on GPU side (fragment shader) based on those values (linear interpolation).
         * @type {Array.<string>} */
        this.colors =
            opts.colors ||
            [
                'rgb(158, 1, 66)',
                'rgb(248, 142, 83)',
                'rgb(251, 248, 176)',
                'rgb(137, 207, 165)',
                'rgb(94, 79, 162)',
            ].reverse()
        if (opts.color)
            this.colors = [
                opts.color(0),
                opts.color(0.2),
                opts.color(0.4),
                opts.color(0.6),
                opts.color(0.8),
                opts.color(1),
            ]

        /**
         * Define the opacity of the style, within [0,1].
         * If this opacity is defined, the individual color opacity will be ignored.
         * @type {function(number,number):number} */
        this.opacity = opts.opacity // (r,z) => ...

        /**
         * A function returning the size of the cells, in geographical unit. All cells have the same size.
         * @type {function(number,number):number} */
        this.size = opts.size // (resolution, z) => ...
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

        //get view scale
        const viewScale = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        //create canvas and webgl renderer
        //for opacity control, see: https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html
        const cvWGL = makeWebGLCanvas(
            geoCanvas.w + '',
            geoCanvas.h + '',
            this.opacity != undefined ? { premultipliedAlpha: false } : undefined
        )
        if (!cvWGL) {
            console.error('No webGL')
            return
        }

        //add vertice and fragment data
        const r2 = resolution / 2
        const verticesBuffer = []
        const tBuffer = []
        for (let cell of cells) {
            const t = this.tFun(cell, resolution, z, viewScale)
            if (t == null || t == undefined) continue
            verticesBuffer.push(cell.x + r2, cell.y + r2)
            tBuffer.push(t > 1 ? 1 : t < 0 ? 0 : t)
        }

        //compute pixel size
        const sizeGeo = this.size ? this.size(resolution, z) : resolution + 0.2 * z

        //compute opacity
        const op = this.opacity ? this.opacity(resolution, z) : undefined

        //
        const wgp = new WebGLSquareColoringAdvanced(cvWGL.gl, this.colors, this.stretching, sizeGeo / z, op)

        //draw
        wgp.draw(verticesBuffer, tBuffer, geoCanvas.getWebGLTransform())

        //draw in canvas geo
        geoCanvas.initCanvasTransform()
        geoCanvas.ctx.drawImage(cvWGL.canvas, 0, 0)

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}
