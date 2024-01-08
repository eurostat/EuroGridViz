//@ts-check
'use strict'

import { Layer } from '../core/Layer.js'
import { json } from 'd3-fetch'

/**
 * @module layer
 * @author Joseph Davies, Julien Gaffuri
 */
export class GeoJSONLayer extends Layer {
    /**
     * @param {object} opts
     */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /**
         * @private
         * @type {string} */
        this.url = opts.url

        /**
         * A preprocess to run on each feature after loading.
         * It can be used to apply some specific treatment before, format the label data, project coordinates, etc.
         * Return false if the label should not be kept.
         * @private
         * @type {function(object):boolean} */
        this.preprocess = opts.preprocess

        /**
         * @private
         * @type {function(object,number):string} */
        this.color = opts.color || ((f, z) => 'gray')
        /**
         * @private
         * @type {function(object,number):number} */
        this.width = opts.width || ((f, z) => 2)
        /**
         * @private
         * @type {function(object,number):Array.<number>|undefined} */
        this.lineDash = opts.lineDash || ((f, z) => undefined)

        /**
         * @private
         * @type {Array.<object> | undefined} */
        this.fs = undefined

        /**
         * @private
         * @type {string} */
        this.loadingStatus = 'notLoaded'
    }

    /**
     * Draw the layer.
     * @param {import("../core/GeoCanvas.js").GeoCanvas} geoCanvas The canvas where to draw the layer.
     * @returns {void}
     */
    draw(geoCanvas) {
        //load data, if not done yet.
        if (!this.fs) {
            this.load(geoCanvas.redraw)
            return
        }

        //TODO sort lines by width ?

        //
        const z = geoCanvas.view.z

        for (const f of this.fs) {
            const cs = f.geometry.coordinates
            if (cs.length < 2) continue

            //set color
            const col = this.color(f, z)
            if (!col || col == 'none') continue
            geoCanvas.ctx.strokeStyle = col

            //set linewidth
            const wP = this.width(f, z)
            if (!wP || wP < 0) continue
            geoCanvas.ctx.lineWidth = wP * z

            //set line dash
            const ldP = this.lineDash(f, z)
            if (ldP) geoCanvas.ctx.setLineDash(ldP)

            //draw line
            geoCanvas.ctx.beginPath()
            geoCanvas.ctx.moveTo(cs[0][0], cs[0][1])
            for (let i = 1; i < cs.length; i++) geoCanvas.ctx.lineTo(cs[i][0], cs[i][1])
            geoCanvas.ctx.stroke()
        }

        //...
        geoCanvas.ctx.setLineDash([])
    }

    /**
     * Load data for labels, from URL this.url
     * @param {function():void} callback
     * @private
     */
    async load(callback) {
        if (!this.url) {
            console.log('Failed loading boundaries: No URL specified. ' + this.url)
            this.loadingStatus = 'failed'
            this.labels = []
            return
        }

        //check if data already loaded
        if (this.loadingStatus != 'notLoaded') return

        //load data
        this.loadingStatus = 'loading'

        try {
            const data_ = await json(this.url)

            /** @type { Array.<object> } */
            const data = data_.features

            //preprocess/filter
            if (this.preprocess) {
                this.fs = []
                for (const c of data) {
                    const b = this.preprocess(c)
                    if (b == false) continue
                    this.fs.push(c)
                }
            } else {
                //store labels
                this.fs = data
            }

            this.loadingStatus = 'loaded'

            //redraw
            if (callback) callback()
        } catch (error) {
            console.log('Failed loading boundaries from ' + this.url)
            this.fs = []
            this.loadingStatus = 'failed'
        }
    }
}
