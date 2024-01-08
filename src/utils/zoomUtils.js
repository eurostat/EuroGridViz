//@ts-check
'use strict'

/**
 *
 * @param {import("../App").App} app
 * @param {number} zTarget
 * @param {number} factor
 * @param {number} delayMs
 * @param {function|undefined} callback
 * @param {number} delayBeforeCallBackMs
 * @returns
 */
export function zoomTo(
    app,
    zTarget,
    factor = 1.01,
    delayMs = 0,
    callback = undefined,
    delayBeforeCallBackMs = 0
) {
    //ensure good factor value: >1
    factor = factor || 1.01
    if (factor < 1) {
        console.error('Unexpected value for factor: ' + factor + '. Set to default value 1.01')
        factor = 1.01
    }

    const zIni = map.getZoom()
    if (zTarget == zIni) return
    if (zTarget < zIni) factor = 1 / factor
    let z = zIni
    let timer = setInterval(() => {
        //compute new zoom level
        z = map.getZoom() * factor
        if (zTarget > zIni && z > zTarget) z = zTarget
        if (zTarget < zIni && z < zTarget) z = zTarget

        //set new zoom level
        map.setZoom(z)
        map.redraw()

        //target reached
        if (z == zTarget) {
            clearInterval(timer)
            //trigger callback, if any
            if (callback)
                setTimeout(() => {
                    callback()
                }, delayBeforeCallBackMs)
        }
    }, delayMs)
    return timer
}

/**
 *
 * @param {import("../App").App} app
 * @param {number} xTarget
 * @param {number} yTarget
 * @param {number} zTarget
 * @param {number} progressFactorPix
 * @param {number} delayMs
 * @param {function|undefined} callback
 * @param {number} delayBeforeCallBackMs
 * @returns
 */
export function goToStraight(
    app,
    xTarget = NaN,
    yTarget = NaN,
    zTarget = NaN,
    progressFactorPix = 5,
    delayMs = 0,
    callback = undefined,
    delayBeforeCallBackMs = 0
) {
    //store initial position/zoom
    const zIni = map.getZoom()
    const cIni = map.getView()

    //default
    xTarget = isNaN(xTarget) ? cIni.x : xTarget
    yTarget = isNaN(yTarget) ? cIni.y : yTarget
    zTarget = isNaN(zTarget) ? zIni : zTarget

    //prepare for pan
    const dx = xTarget - cIni.x
    const dy = yTarget - cIni.y
    let d = Math.hypot(dx, dy)
    const ddx = (progressFactorPix * zIni * dx) / d
    const ddy = (progressFactorPix * zIni * dy) / d

    //prepare for zoom
    let r = zTarget / zIni
    const n = d / (progressFactorPix * zIni)
    const zoomFactor = d > 0 ? Math.pow(r, 1 / n) : Math.pow(r, 1 / 10) //TODO not 10 ?

    //timer
    let timer = setInterval(() => {
        //compute and set new position
        if (d > 0) {
            const c = map.getView()
            let nx = c.x + ddx
            let ny = c.y + ddy
            //if went too far, stop at target values
            if (nx < xTarget && xTarget < c.x) nx = xTarget
            if (c.x < xTarget && xTarget < nx) nx = xTarget
            if (ny < yTarget && yTarget < c.y) ny = yTarget
            if (c.y < yTarget && yTarget < ny) ny = yTarget
            map.setGeoCenter({ x: nx, y: ny })
            if (nx == xTarget && ny == yTarget) d = 0
        }

        //compute and set new zoom
        if (r != 1) {
            const z = map.getZoom()
            let nz = zoomFactor * z
            //if went too far, stop at target values
            if (nz < zTarget && zTarget < z) nz = zTarget
            if (z < zTarget && zTarget < nz) nz = zTarget
            map.setZoom(nz)
            if (nz == zTarget) r = 1
        }

        //redraw
        map.redraw()

        //if target reached, stop
        if (d == 0 && r == 1) {
            //console.log("OK !")
            clearInterval(timer)
            //trigger callback, if any
            if (callback)
                setTimeout(() => {
                    callback()
                }, delayBeforeCallBackMs)
        }
    }, delayMs)

    return timer
}
