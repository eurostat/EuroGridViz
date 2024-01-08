//@ts-check
'use strict'

import { Layer } from '../core/Layer.js'

/**
 * A layer, which specifies a dataset to be shown with specified styles.
 *
 * @module layer
 * @author Joseph Davies, Julien Gaffuri
 */
export class GridLayer extends Layer {
    /**
     * @param {import("../core/Dataset").Dataset|import("../core/MultiResolutionDataset").MultiResolutionDataset} dataset The dataset to show.
     * @param {Array.<import("../core/Style").Style>} styles The styles, ordered in drawing order.
     * @param {{visible?:function(number):boolean,alpha?:function(number):number,blendOperation?:function(number):GlobalCompositeOperation,minPixelsPerCell?:number,cellInfoHTML?:function(import("../core/Dataset").Cell):string}} opts
     */
    constructor(dataset, styles, opts = {}) {
        super(opts)
        opts = opts || {}

        /** @type {import("../core/Dataset").Dataset|import("../core/MultiResolutionDataset").MultiResolutionDataset} */
        this.dataset = dataset

        /** @type {Array.<import("../core/Style").Style>} */
        this.styles = styles

        /** 
         * This parameter is used when the dataset is a MultiResolutionDataset.
         * It defines the minimum number of pixels a grid cell should have to select the dataset to display based on its resolution.
         * A low value, means that the map will be more detailled (smaller cells).
         * A high value, means that the map will be less detailled (larger cells).
         * This value should be higher than 1, otherwise it means a grid cell is smaller than the screen resolution.
         * For more complex cell representations that require some more map space, this value should be higher.
         * @type {number} */
        this.minPixelsPerCell = opts.minPixelsPerCell || 3

        /**
         * The function returning cell information as HTML.
         * This is typically used for tooltip information.
         * @type {function(import("../core/Dataset").Cell, number):string} */
        this.cellInfoHTML = opts.cellInfoHTML || GridLayer.defaultCellInfoHTML
    }

    /** */
    draw(geoCanvas, legend) {

        //get zoom level
        const z = geoCanvas.view.z

        //get layer dataset component
        /** @type {import('../core/Dataset.js').Dataset|undefined} */
        const dsc = this.getDataset(z)
        if (!dsc) return

        //launch data download, if necessary
        dsc.getData(geoCanvas.extGeo)

        //update dataset view cache
        dsc.updateViewCache(geoCanvas.extGeo)

        //draw cells, style by style
        for (const s of this.styles) {

            //check if style is visible
            if (s.visible && !s.visible(z)) continue

            //set style alpha and blend mode
            //TODO: multiply by layer alpha ?
            geoCanvas.ctx.globalAlpha = s.alpha ? s.alpha(z) : 1.0
            geoCanvas.ctx.globalCompositeOperation = s.blendOperation(z)

            //set affin transform to draw with geographical coordinates
            geoCanvas.setCanvasTransform()

            //draw with style
            s.draw(dsc.getViewCache(), geoCanvas, dsc.getResolution())

            //draw style filter
            if (s.filterColor)
                s.drawFilter(geoCanvas)
        }

        //add legend element
        if (legend) {
            for (const s of this.styles) {
                //check if style is visible
                if (s.visible && !s.visible(z)) continue
                for (const lg of s.legends) {
                    //console.log(s, lg)
                    //this.legend.append(lg.div)
                    //s1.node().appendChild(s2.node())
                    legend.node().append(lg.div.node())
                }

                //case for styles of styles, like kernel smoothing
                //TODO do better
                if (s['styles']) {
                    for (const s2 of s['styles']) {
                        if (s2.visible && !s2.visible(z)) continue
                        for (const lg of s2.legends) {
                            //console.log(s, lg)
                            //this.legend.append(lg.div)
                            //s1.node().appendChild(s2.node())
                            legend.node().append(lg.div.node())
                        }
                    }
                }
            }
        }

    }



    /**
     * Return the relevant dataset component for a specified zoom.
     *
     * @param {number} z
     * @returns {import("../core/Dataset").Dataset|undefined}
     * */
    getDataset(z) {
        return this.dataset.getDataset(z, this.minPixelsPerCell);
    }



    /**
     * Set/get style stack.
     * 
     * @param {undefined|import("../core/Style").Style|Array.<import("../core/Style").Style>} styles 
     * @returns { this | Array.<import("../core/Style").Style> }
     */
    styles_(styles) {
        if (arguments.length === 0) return this.styles
        if (arguments.length === 1)
            if (Array.isArray(styles)) this.styles = styles
            else this.styles = [styles]
        else this.styles = arguments
        return this
    }



    /**
     * The default function returning cell information as HTML.
     * This is typically used for tooltip information.
     *
     * @param {import("../core/Dataset").Cell} cell
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
