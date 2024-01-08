//@ts-check
'use strict'

/**
 * A multi resolution dataset of grid cells.
 * It consists of different {@link Dataset}s for each resolution.
 *
 * @abstract
 *
 * @module core
 * @author Joseph Davies, Julien Gaffuri
 */
export class MultiResolutionDataset {
    /**
     * @param {Array.<number>} resolutions The resolutions of the datasets, in CRS geographical unit.
     * @param {Array.<import("./Dataset").Dataset>|function(number):import("./Dataset").Dataset} datasets The datasets list, one per resolution. Or a function that returns a dataset from a resolution value.
     * @param { {preprocess?:function(import("./Dataset").Cell):boolean} } opts Options. preprocess: A function to apply on each dataset cell to prepare its values. Can be used also to select cells to keep.
     */
    constructor(resolutions, datasets, opts = {}) {
        opts = opts || {}

        /** The resolutions of the datasets, in CRS geographical unit.
         * @type {Array.<number>} */
        this.resolutions = resolutions

        /** The datasets. If the list is not explictely defined, build it from the resolution list with the function
         * @type {Array.<import("./Dataset").Dataset>} */
        this.datasets = (typeof datasets === 'function') ? this.resolutions.map(datasets) : datasets

        //there must be as many datasets as resolutions
        if (this.datasets.length > 1 && this.datasets.length != this.resolutions.length)
            throw new Error(
                'Uncompatible number of datasets and resolutions: ' +
                this.datasets.length +
                ' ' +
                this.resolutions.length
            )

        //set dataset preprocesses if specified
        if (opts.preprocess) this.setPrepocesses(opts.preprocess)
    }


    /**
     * Return the relevant dataset for a specified zoom.
     * @param {number} z
     * @param {number} minPixelsPerCell
     * @returns {import("./Dataset").Dataset|undefined}
     * */
    getDataset(z, minPixelsPerCell) {

        //special case whith single dataset
        if (this.datasets.length == 1) return this.datasets[0]

        const rs = this.resolutions
        let i = 0
        let z_ = rs[i] / minPixelsPerCell
        while (z_ < z && i < rs.length) {
            i++
            z_ = rs[i] / minPixelsPerCell
        }
        //if (i == 0) return this.dataset.datasets[0];
        //return this.dataset.datasets[i - 1];
        if (i == rs.length) return this.datasets[rs.length - 1]
        return this.datasets[i]
    }



    /**
     * Set a preprocess function for all datasets.
     * This is a function applied on each cell after it has been loaded.
     *
     * @param {function(import("./Dataset").Cell):boolean} preprocess
     * @returns {this}
     */
    setPrepocesses(preprocess) {
        for (let ds of this.datasets) ds.preprocess = preprocess
        return this
    }

    /**
     * A function to ease the creation of multi resolution datasets.
     *
     * @param {Array.<number>} resolutions The resolutions of the datasets, in CRS geographical unit
     * @param {function(number):import("./Dataset").Dataset} resToDataset Function returning a dataset from a resolution
     * @param { {preprocess?:function(import("./Dataset").Cell):boolean} } opts Options. preprocess: A function to apply on each dataset cell to prepare its values
     * @returns {MultiResolutionDataset}
     */
    /*static make(resolutions, resToDataset, opts) {
        //make datasets
        const dsc = []
        for (const res of resolutions) dsc.push(resToDataset(res))
        //make multi resolution dataset
        return new MultiResolutionDataset(dsc, resolutions, opts)
    }*/
}
