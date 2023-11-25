//@ts-check
'use strict'


/**
 * Some function [0,1]->[0,1] to stretch range of values.
 * @see https://github.com/eurostat/gridviz/blob/master/docs/reference.md#stretching
 * @see https://observablehq.com/@jgaffuri/stretching
 */


//TODO use special cases - for Math.sqrt, etc.

/**
 * @param {number} base 
 * @returns {function(number):number}
 */
export const exponentialScale = (base = 3) => {
    if (base == 0) return t => t
    const a = (Math.exp(base) - 1)
    return t => (Math.exp(t * base) - 1) / a
}

/**
 * @param {number} base 
 * @returns {function(number):number}
 */
export const logarithmicScale = (base = 3) => {
    if (base == 0) return t => t
    const a = Math.exp(base), b = 1 - a
    return t => 1 - Math.log(a + t * b) / base
}





/**
 * @param {number} exponent 
 * @returns {function(number):number}
 */
export const powerScale = (exponent = 3) => {
    if (exponent == 0.5) return Math.sqrt
    return t => Math.pow(t, exponent)
}

/**
 * @param {number} exponent 
 * @returns {function(number):number}
 */
export const powerInverseScale = (exponent = 3) => {
    if (exponent == 2) return t => 1 - Math.sqrt(1 - t)
    const a = 1 / exponent
    return t => 1 - Math.pow(1 - t, a)
}




/**
 * @param {number} circularity 
 * @returns {function(number):number}
 */
export const circularScale = (circularity = 0.8) => {
    if (circularity == 0) return t => t
    if (circularity == 1) return t => Math.sqrt(t * (2 - t))
    else {
        const a = circularity / (1 - circularity)
        return t => Math.sqrt(1 / (a * a) + t * (2 / a + 2 - t)) - 1 / a
    }
}

/**
 * @param {number} circularity 
 * @returns {function(number):number}
 */
export const circularInverseScale = (circularity = 0.8) => {
    const f = circularScale(circularity)
    return t => 1 - f(1 - t)
}
