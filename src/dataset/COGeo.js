//@ts-check
'use strict'

import { DatasetComponent } from '../DatasetComponent.js'

/**
 * @todo
 * A dataset composed of a COGeo file.
 * @see https://www.cogeo.org/
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class COGeo extends DatasetComponent {
    /**
     *
     * @param {String} url
     * @param {{preprocess?:(function(import("../Dataset").Cell):boolean)}} opts
     */
    constructor(url, opts = {}) {
        super(url, 0, opts)
    }

    //TODO Use https://geotiffjs.github.io/
}
