//@ts-check
'use strict'

import { extent, max } from "d3-array"
import { scaleQuantile } from "d3-scale"

/**
 * A scale is simply a function that map a domain to a range.
 * @typedef {function(number):number} Scale */

/**
 * A scale whose range is a color (string).
* @typedef {function(number):string} ColorScale */


/**
 * @module utils
 */


/**
 * Generic function for view scale - continuous or discrete
 * 
 * @param {{ valueFunction:function(import("../core/Dataset").Cell):number, minValue?:number, minSizePix?:number, maxSizeFactor?:number, range?:[number, number], domain?:[number, number], stretching?:function(number):number, classNumber?:number}} opts 
 * @returns {function(Array.<import("../core/Dataset").Cell>):Scale}
 */
export const viewScale = (opts) => {
    const valueFunction = opts.valueFunction
    const minValue = opts.minValue || 0
    const minSizePix = opts.minSizePix || 0
    const maxSizeFactor = opts.maxSizeFactor || 1
    const stretching = opts.stretching
    const range_ = opts.range
    const domain_ = opts.domain
    const classNumber = opts.classNumber
    return (cells, resolution, z) => {
        const domain = domain_ || [minValue, max(cells, valueFunction)]
        const range = range_ || [minSizePix * z, resolution * maxSizeFactor]
        const domainSize = domain[1] - domain[0], domainMin = domain[0]
        const rangeSize = range[1] - range[0], rangeMin = range[0]
        return t => {
            //scale to [0,1]
            t = (t - domainMin) / domainSize
            //stretch
            if (stretching) t = stretching(t)
            //classify
            if (classNumber) t = t == 1 ? 1 : Math.floor(t * (classNumber)) / (classNumber - 1)
            //scale to range
            return rangeMin + t * rangeSize
        }
    }
}



/**
 * Generic function for view scale - quantile
 * 
 * @param {{ valueFunction:function(import("../core/Dataset").Cell):number, classNumber?:number, minSizePix?:number, maxSizeFactor?:number }} opts 
 * @returns {function(Array.<import("../core/Dataset").Cell>):Scale}
 */
export const viewScaleQuantile = (opts) => {
    const valueFunction = opts.valueFunction
    const classNumber = opts.classNumber || 12
    const minSizePix = opts.minSizePix || 1
    const maxSizeFactor = opts.maxSizeFactor || 1
    const scale = scaleQuantile()
    return (cells, resolution, z) => {
        scale.domain(cells.map(valueFunction))
        const minSizeGeo = minSizePix * z, maxSizeGeo = resolution * maxSizeFactor
        scale.range(Array.from({ length: classNumber }, (_, i) => minSizeGeo + i * (maxSizeGeo - minSizeGeo) / (classNumber - 1)))
        scale.breaks = scale.quantiles()
        scale.values = scale.range()
        return scale;
    }
}






/**
 * Generic function for color view scale - continuous or discrete
 * 
 * @param {{ valueFunction:function(import("../core/Dataset").Cell):number, colorScale?:function(number):string, colors?:Array.<string>, stretching?:function(number):number }} opts 
 * @returns {function(Array.<import("../core/Dataset").Cell>):ColorScale}
 */
export const viewScaleColor = (opts) => {
    const valueFunction = opts.valueFunction
    const stretching = opts.stretching
    let colorScale = opts.colorScale || (() => "purple")

    //discrete colors case: build continuous color scale from discrete ones.
    const nbClass = opts.colors?.length
    if (opts.colors && nbClass)
        colorScale = t => opts.colors[t == 1 ? nbClass - 1 : Math.floor(t * nbClass)]

    return (cells) => {
        if (cells.length == 0 || !cells) return
        /** @type {[undefined, undefined] | [number, number]} */
        const domain = extent(cells, valueFunction)
        if (domain[0] == undefined) return
        const domainSize = domain[1] - domain[0]
        const scale = t => {
            //scale to [0,1]
            t = (t - domain[0]) / domainSize
            //stretch
            if (stretching) t = stretching(t)
            return colorScale(t)
        }
        //function that return the domain value from the [0,1] range.
        scale.invert = t => {
            if (stretching) t = stretching.invert(t)
            return domain[0] + t * domainSize
        }
        //discrete colors: return the breaks
        if (opts.colors && nbClass) {
            scale.breaks = []
            for (let i = 1; i < nbClass; i++)
                scale.breaks.push(scale.invert(i / nbClass))
        }

        return scale;
    }
}





/**
 * Generic function for color view scale - quantile
 * 
 * @param {{ valueFunction:function(import("../core/Dataset").Cell):number, classNumber?:number, colors?:Array.<string>, colorScale?:function(number):string }} opts 
 * @returns {function(Array.<import("../core/Dataset").Cell>):ColorScale}
 */
export const viewScaleColorQuantile = (opts) => {
    const valueFunction = opts.valueFunction
    const classNumber = opts.classNumber || 12

    let colors = opts.colors
    if (opts.colorScale) colors = discreteColors(opts.colorScale, classNumber)
    colors = colors || Array.from({ length: classNumber }, (_, i) => "rgb(" + Math.floor(255 * i / (classNumber - 1)) + ",150,150)")

    const scale = scaleQuantile().range(colors)
    return (cells) => {
        scale.domain(cells.map(valueFunction));
        scale.breaks = scale.quantiles()
        scale.colors = colors
        return scale;
    }
}




/**
 * Combine view scale functions
 * 
 * @param {*} obj 
 * @returns {function}
 */
export const viewScaleCombination = (obj) => {
    //obj: prop and a function to call
    return (cells, resolution, z) => {
        const out = {}
        for (const p in obj) { out[p] = obj[p](cells, resolution, z) }
        return out
    }
}






/**
 * Return a classifier function from break values.
 * The classifier function returns the class id (from 0 to breaks.length) from a value to classifiy.
 * @param {Array.<number>} breaks the breaks
 */
export function classifier(breaks) {
    const bl = breaks.length
    const classifier = value => {
        let i = 0
        while (i < bl) {
            const break_ = breaks[i]
            if (value <= break_) return i
            i++
        }
        return i
    }
    classifier.breaks = breaks
    return classifier
}



/**
 * Return a color classifier function from break values.
 * The classifier function returns the color from a value to classifiy.
 * There should be one color more than break values.
 * @param {Array.<number>} breaks the breaks
 * @param {Array.<string>} colors the colors
 */
export function colorClassifier(breaks, colors) {
    const classifier_ = classifier(breaks)
    const colorClassifier = value => colors[classifier_(value)]
    colorClassifier.breaks = breaks
    colorClassifier.colors = colors
    return colorClassifier
}

/**
 * Make array of colors from a colorScale.
 * It is a kind of sampling, or un-interpolation
 * 
 * @param {function(number):string} colorScale 
 * @param {number} nb 
 */
export function discreteColors(colorScale, nb) {
    if (nb == 1) return [colorScale(0.5)]
    const out = []
    for (let i = 0; i < nb; i++)
        out.push(colorScale(i / (nb - 1)))
    return out
}
