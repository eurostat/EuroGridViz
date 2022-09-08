//@ts-check

import { DatasetComponent } from "./DatasetComponent";

/** 
 * A grid cell.
 * @typedef {{x: number, y: number}} Cell */
/**
 * An envelope.
 * @typedef { {xMin: number, xMax: number, yMin: number, yMax: number} } Envelope */

/**
 * A multi resolution dataset of grid cells.
 * It consists of different {@link DatasetComponent}s for each resolution.
 * 
 * @abstract
 * 
 * @author Joseph Davies, Julien Gaffuri
 */
export class Dataset {

    /**
     * @param {Array.<DatasetComponent>} datasetComponents The dataset components
     * @param {Array.<number>} resolutions The resolutions of the dataset components, in CRS geographical unit
     * @param { {preprocess?:function(Cell):void} } opts Options. preprocess: A function to apply on each dataset cell to prepare its values
     */
    constructor(datasetComponents, resolutions, opts = {}) {
        opts = opts || {};

        /** The dataset components.
         * @type {Array.<DatasetComponent>} */
        this.datasetComponents = datasetComponents;

        /** The resolutions of the dataset components, in CRS geographical unit.
         * @type {Array.<number>} */
        this.resolutions = resolutions;

        //there must be as many dataset components as resolutions
        if (this.datasetComponents.length > 1 && this.datasetComponents.length != this.resolutions.length)
            throw new Error("Uncompatible number of datasets and resolutions: " + this.datasetComponents.length + " " + this.resolutions.length)

        //set dataset preprocesses if specified
        if (opts.preprocess)
            this.setPrepocesses(opts.preprocess)
    }

    /**
     * Set a preprocess function for all dataset components.
     * This is a function applied on each cell after it has been loaded.
     * 
     * @param {function(Cell):void} preprocess 
     * @returns {this}
     */
    setPrepocesses(preprocess) {
        for (let ds of this.datasetComponents)
            ds.preprocess = preprocess
        return this;
    }




    /**
     * 
     * @param {Array.<number>} resolutions The resolutions of the dataset components, in CRS geographical unit
     * @param {function(number):DatasetComponent} resToDatasetComponent Function returning a dataset component from a resolution
     * @param { {preprocess?:function(Cell):void} } opts Options. preprocess: A function to apply on each dataset cell to prepare its values
     * @returns 
     */
    static make(resolutions, resToDatasetComponent, opts) {

        //make dataset components
        const dsc = []
        for (const res of resolutions)
            dsc.push(resToDatasetComponent(res))
        //make dataset
        return new Dataset(dsc, resolutions, opts)
    }

}
