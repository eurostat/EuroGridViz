//@ts-check
'use strict'

/**
 * Get the class id from a value and class break values
 *
 * @param {number} v the value
 * @param {Array.<number>} breaks the breaks
 * @returns The class id, from 0 to breaks.length
 * @deprecated use getClassifier instead
 */
export function getClass(v, breaks) {
    if (!breaks) return
    if (breaks.length == 0) return 0
    if (v <= breaks[0]) return 0
    for (let i = 1; i < breaks.length; i++) if (breaks[i - 1] < v && v <= breaks[i]) return i
    return breaks.length
}



//take 'nice' value (power of ten, or multiple)
export function nice(v, multiples = [8, 6, 5, 4, 2.5, 2]) {
    //compute bigger power of ten below
    const v_ = Math.pow(10, Math.floor(Math.log10(v)))
    for (let multiple of multiples)
        if (v_ * multiple <= v) return v_ * multiple
    return v_
}



/*
export let monitor = false

let previousDate
export function monitorDuration(message) {
    const nowDate = Date.now()

    //first call
    if (!previousDate) {
        previousDate = nowDate
        console.log(previousDate, message)
        return
    }

    const d = nowDate - previousDate
    previousDate = nowDate
    console.log(d, message)
}
*/
