//@ts-check
'use strict'


/**
 * Some function [0,1]->[0,1] to stretch range of values.
 * @see https://github.com/eurostat/gridviz/blob/master/docs/reference.md#stretching
 * @see https://observablehq.com/@jgaffuri/stretching
 */


export const powerScale = (exponent = 3) => t => Math.pow(t, exponent)
export const powerInverseScale = (exponent = 3) => t => 1 - Math.pow(1 - t, 1 / exponent)
export const exponentialScale = (base = 3) => {
    if (base == 0) return t => t
    const a = (Math.exp(base) - 1)
    return t => (Math.exp(t * base) - 1) / a
}
export const logarithmicScale = (base = 3) => {
    if (base == 0) return t => t
    return t => 1 - (1 / base) * Math.log(Math.exp(base) * (1 - t) + t)
}

export const circularScale = (alpha = 0.8) => {
    if (alpha == 0) return t => t
    if (alpha == 1) return t => Math.sqrt(t * (2 - t))
    else {
        const a = alpha / (1 - alpha)
        return t => Math.sqrt(1 / (a * a) + t * (2 / a + 2 - t)) - 1 / a
    }
}
export const circularInverseScale = (alpha = 0.8) => {
    const f = circularScale(alpha)
    return t => 1 - f(1 - t)
}








// deprecated


/**
 * Function [0,1]->[0,1] to stretch range of values.
 * Polynomial
 *
 * @param {number} t The value to stretch, within [0,1]
 * @param {number} exponent 1: no stretching. <1: show low values. >1: show high values.
 * @returns {number} The stretched value, within [0,1]
 */
export const sPow = (t, exponent = 3) => Math.pow(t, exponent)

/**
 * Function [0,1]->[0,1] to stretch range of values.
 * Polynomial (reverse)
 *
 * @param {number} t The value to stretch, within [0,1]
 * @param {number} exponent 1: no stretching. <1: show low values. >1: show high values.
 * @returns {number} The stretched value, within [0,1]
 */
export const sPowRev = (t, exponent = 3) => 1 - Math.pow(1 - t, 1 / exponent)

/**
 * Function [0,1]->[0,1] to stretch range of values.
 * Exponential
 *
 * @param {number} t The value to stretch, within [0,1]
 * @param {number} base 0: no stretching. -Inf: show low values. Inf: show high values.
 * @returns {number} The stretched value, within [0,1]
 */
export const sExp = (t, base = 3) => (base == 0 ? t : (Math.exp(t * base) - 1) / (Math.exp(base) - 1))

/**
 * Function [0,1]->[0,1] to stretch range of values.
 * Exponential (reverse)
 *
 * @param {number} t The value to stretch, within [0,1]
 * @param {number} base 0: no stretching. -Inf: show low values. Inf: show high values.
 * @returns {number} The stretched value, within [0,1]
 */
export const sExpRev = (t, base = 3) =>
    base == 0 ? t : 1 - (1 / base) * Math.log(Math.exp(base) * (1 - t) + t)

/**
 * Function [0,1]->[0,1] to stretch range of values.
 * Circle, show low values
 * NB: sCircleHigh and sCircleLow are inverse functions of each other.
 *
 * @param {number} t The value to stretch, within [0,1]
 * @param {number} alpha 0: no stretching. 1: perfect circle section
 * @returns {number} The stretched value, within [0,1]
 */
export const sCircleLow = (t, alpha = 0.8) => {
    if (alpha == 0) return t
    if (alpha == 1) return Math.sqrt(t * (2 - t))
    const a = alpha / (1 - alpha)
    return Math.sqrt(1 / (a * a) + t * (2 / a + 2 - t)) - 1 / a
}

/**
 * Function [0,1]->[0,1] to stretch range of values.
 * Circle, show high values
 * NB: sCircleHigh and sCircleLow are inverse functions of each other.
 *
 * @param {number} t The value to stretch, within [0,1]
 * @param {number} alpha 0: no stretching. 1: perfect circle section
 * @returns {number} The stretched value, within [0,1]
 */
export const sCircleHigh = (t, alpha = 0.8) => 1 - sCircleLow(1 - t, alpha)

/**
 * Inverse functions
 */

/**
 * Inverse function of sExp
 * @param {number} y
 * @param {number} base
 * @returns {number}
 */
export const sExpInverse = (y, base = 3) =>
    base == 0 ? y : (1 / base) * Math.log(1 - y + y * Math.exp(base))

/**
 * Inverse function of sExpRev
 * @param {number} y
 * @param {number} base
 * @returns {number}
 */
export const sExpRevInverse = (y, base = 3) => (Math.exp(-base * y) - 1) / (Math.exp(-base) - 1)

/**
 * Inverse function of sPow
 * @param {number} y
 * @param {number} exponent
 * @returns {number}
 */

export const sPowInverse = (y, exponent = 3) => Math.pow(y, 1 / exponent)





/**
 * Inverse function of sPowRev
 * @param {number} y
 * @param {number} exponent
 * @returns {number}
 */
export const sPowRevInverse = (y, exponent = 3) => 1 - Math.pow(1 - y, exponent)

//test code
/*
for (let i = 0; i <= 1; i += 0.001) {
  //const v = gviz.sExp(gviz.sExpInverse(i));
  //const v = gviz.sExpInverse(gviz.sExp(i));
  //const v = gviz.sExpRev(gviz.sExpRevInverse(i));
  //const v = gviz.sExpRevInverse(gviz.sExpRev(i));
  //const v = gviz.sPow(gviz.sPowInverse(i));
  //const v = gviz.sPowInverse(gviz.sPow(i));
  //const v = gviz.sPowRev(gviz.sPowRevInverse(i));
  //const v = gviz.sPowRevInverse(gviz.sPowRev(i));
  //const v = gviz.sCircleLow(gviz.sCircleHigh(i));
  //const v = gviz.sCircleHigh(gviz.sCircleLow(i));
  console.log(i - v)
}
*/
