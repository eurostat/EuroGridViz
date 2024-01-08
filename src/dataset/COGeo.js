//@ts-check
'use strict'

import { Dataset } from '../core/Dataset.js'

/**
 * @todo
 * A dataset composed of a COGeo file.
 * @see https://www.cogeo.org/
 *
 * @module dataset
 * @author Joseph Davies, Julien Gaffuri
 */
export class COGeo extends Dataset {
    /**
     *
     * @param {String} url
     * @param {{preprocess?:(function(import("../core/Dataset").Cell):boolean)}} opts
     */
    constructor(map, url, opts = {}) {
        super(map, url, 0, opts)
    }

    //TODO Use https://geotiffjs.github.io/
}
