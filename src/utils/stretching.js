//@ts-check
'use strict'

/**
 * @module utils
 */


//TODO invert for circular
//TODO use Math.sqrt
//TODO validate


/**
 * Some function [0,1]->[0,1] to stretch range of values.
 * @see https://github.com/eurostat/gridviz/blob/master/docs/reference.md#stretching
 * @see https://observablehq.com/@jgaffuri/stretching
 */

//identity function
const identity = t => t
identity.invert = identity


/**
 * @param {number} base 
 * @returns {function(number):number}
 */
export const exponentialScale = (base = 3) => {
    if (base == 0) return identity
    const a = (Math.exp(base) - 1)
    const f = t => (Math.exp(t * base) - 1) / a
    f.invert = t => Math.log(a * t + 1) / base
    return f
}

/**
 * @param {number} base 
 * @returns {function(number):number}
 */
export const logarithmicScale = (base = 3) => {
    if (base == 0) return identity
    const a = Math.exp(base), b = 1 - a
    const f = t => 1 - Math.log(a + t * b) / base
    f.invert = t => (Math.exp((1 - t) * base) - a) / b
    return f
}





/**
 * @param {number} exponent 
 * @returns {function(number):number}
 */
export const powerScale = (exponent = 3) => {
    if (exponent == 1) return identity
    //TODO if (exponent == 0.5) return Math.sqrt
    const f = t => Math.pow(t, exponent)
    const a = 1 / exponent
    f.invert = t => Math.pow(t, a)
    return f
}

/**
 * @param {number} exponent 
 * @returns {function(number):number}
 */
export const powerInverseScale = (exponent = 3) => {
    if (exponent == 1) return identity
    //TODO if (exponent == 2) return t => 1 - Math.sqrt(1 - t)
    const a = 1 / exponent
    const f = t => 1 - Math.pow(1 - t, a)
    f.invert = t => 1 - Math.pow(1 - t, exponent)
    return f
}




/**
 * @param {number} circularity 
 * @returns {function(number):number}
 */
export const circularScale = (circularity = 0.8) => {
    if (circularity == 0) return identity
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
    if (circularity == 0) return identity
    const f = circularScale(circularity)
    return t => 1 - f(1 - t)
}





//test
/*
const test = (f, fun, a, err = 1e-12) => {
    for (let t = 0; t <= 1; t += 1 / 50) {
        const er = t - f.invert(f(t))
        if (Math.abs(er) < err) continue
        console.log(fun, a, er)
    }
}

for (let fun of [powerScale, powerInverseScale])
    for (let exp = -30; exp <= 50; exp += 1) {
        if (exp == 0) continue
        const f = fun(exp)
        test(f, fun, exp)
    }


for (let fun of [exponentialScale, logarithmicScale])
    for (let base = -20; base <= 20; base += 1) {
        //if (exp == 0) continue
        const f = fun(base)
        test(f, fun, base, 1e-10)
    }
*/