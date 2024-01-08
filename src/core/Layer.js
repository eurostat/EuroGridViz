//@ts-check
'use strict'

import { Drawable } from "./Drawable.js"

/**
 * @module core
 * @abstract
 * @author Joseph Davies, Julien Gaffuri
 */
export class Layer extends Drawable {

    /**
     * Draw layer.
     * 
     * @param {import("./GeoCanvas").GeoCanvas} geoCanvas The canvas where to draw the layer.
     * @param {object} legend
     * @returns {void}
     * @abstract
     */
    draw(geoCanvas, legend = undefined) {
        throw new Error('Method draw not implemented.')
    }

}
