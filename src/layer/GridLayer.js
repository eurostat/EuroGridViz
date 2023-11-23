//@ts-check
'use strict'

import { Layer } from "../Layer.js"

/**
 * A layer, which specifies a dataset to be shown with specified styles.
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class GridLayer extends Layer {
    /**
     * @param {import("../Dataset").Dataset|import("../MultiResolutionDataset").MultiResolutionDataset} dataset The dataset to show.
     * @param {Array.<import("../Style").Style>} styles The styles, ordered in drawing order.
     * @param {{visible?:boolean,alpha?:number,blendOperation?:GlobalCompositeOperation,minZoom?:number,maxZoom?:number,pixNb?:number,cellInfoHTML?:function(import("../Dataset").Cell):string}} opts
     *      minZoom: The minimum zoom level when to show the layer. maxZoom: The maximum zoom level when to show the layer
     */
    constructor(dataset, styles, opts = {}) {
        super(opts)
        opts = opts || {}

        /** @type {import("../Dataset").Dataset|import("../MultiResolutionDataset").MultiResolutionDataset} */
        this.dataset = dataset
        /** @type {Array.<import("../Style").Style>} */
        this.styles = styles

        /** Unit: number of pixels
         * @type {number} */
        this.pixNb = opts.pixNb || 3

        /**
         * The function returning cell information as HTML.
         * This is typically used for tooltip information.
         * @type {function(import("../Dataset").Cell, number):string} */
        this.cellInfoHTML = opts.cellInfoHTML || GridLayer.defaultCellInfoHTML
    }

    /**
     * Return the relevant dataset component for a specified zoom.
     *
     * @param {number} z
     * @returns {import("../Dataset").Dataset|undefined}
     * */
    getDataset(z) {
        if (z < this.minZoom || z > this.maxZoom) return
        return this.dataset.getDataset(z, this.pixNb);
    }

    /**
     * The default function returning cell information as HTML.
     * This is typically used for tooltip information.
     *
     * @param {import("../Dataset").Cell} cell
     * @returns {string}
     */
    static defaultCellInfoHTML(cell) {
        const buf = []
        for (const key of Object.keys(cell)) {
            if (key === 'x') continue
            if (key === 'y') continue
            buf.push('<b>', key, '</b>', ' : ', cell[key], '<br>')
        }
        return buf.join('')
    }
}
