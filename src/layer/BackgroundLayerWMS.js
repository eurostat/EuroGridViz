//@ts-check
'use strict'

import { Layer } from '../core/Layer.js'

/**
 *
 * A map WMS background layer.
 * 
 * @module layer
 * @author Julien Gaffuri
 */
export class BackgroundLayerWMS extends Layer {
    /**
     * @param {object} opts
     */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /**
         * @type {string} */
        this.url = opts.url

        /** @type {HTMLImageElement|undefined} */
        this.img = undefined;

        /** @type {number|undefined} */
        this.xMin = undefined;
        /** @type {number|undefined} */
        this.xMax = undefined;
        /** @type {number|undefined} */
        this.yMin = undefined;
        /** @type {number|undefined} */
        this.yMax = undefined;
    }

    /** Check if the view has moved and a new image needs to be retrieved.
     * @private */
    hasMoved(extGeo) {
        if ((extGeo.xMin) != this.xMin) return true
        else if ((extGeo.xMax) != this.xMax) return true
        else if ((extGeo.yMin) != this.yMin) return true
        else if ((extGeo.yMax) != this.yMax) return true
        else return false
    }


    /**
     * @param {import("../core/GeoCanvas").GeoCanvas} geoCanvas The canvas where to draw the layer.
     * @returns {void}
     */
    draw(geoCanvas) {

        //update map extent
        geoCanvas.updateExtentGeo(0)

        if (!this.hasMoved(geoCanvas.extGeo) && this.img) {
            //the map did not move and the image was already downloaded: draw the image
            geoCanvas.initCanvasTransform()
            geoCanvas.ctx.drawImage(this.img, 0, 0, geoCanvas.w, geoCanvas.h)

        } else {
            //the map moved: retrieve new image

            //
            this.xMin = geoCanvas.extGeo.xMin
            this.xMax = geoCanvas.extGeo.xMax
            this.yMin = geoCanvas.extGeo.yMin
            this.yMax = geoCanvas.extGeo.yMax

            //build WMS URL
            const url = []
            url.push(this.url)
            url.push("&width=")
            url.push(geoCanvas.w)
            url.push("&height=")
            url.push(geoCanvas.h)
            //bbox: xmin ymin xmax ymax
            url.push("&bbox=")
            url.push(geoCanvas.extGeo.xMin)
            url.push(",")
            url.push(geoCanvas.extGeo.yMin)
            url.push(",")
            url.push(geoCanvas.extGeo.xMax)
            url.push(",")
            url.push(geoCanvas.extGeo.yMax)

            const urlS = url.join("")
            //console.log(urlS)

            if (!this.img) {
                this.img = new Image()
                this.img.onload = () => {
                    geoCanvas.redraw()
                }
                this.img.onerror = () => {
                    //case when no image
                    console.warn("Could not retrieve WMS background image from", urlS)
                }
            }

            //set URL to launch the download
            this.img.src = urlS
        }

    }
}
