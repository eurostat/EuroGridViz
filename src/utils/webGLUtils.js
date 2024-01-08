//@ts-check
'use strict'

/**
 * @param {string} width
 * @param {string} height
 * @param {object} opts
 * @returns {{canvas:HTMLCanvasElement, gl:WebGLRenderingContext}}
 */
export function makeWebGLCanvas(width, height, opts={}) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', width)
    canvas.setAttribute('height', height)
    /** @type {WebGLRenderingContext} */
    const gl = canvas.getContext('webgl', opts)
    if (!gl) {
        throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.')
    }
    return { canvas: canvas, gl: gl }
}

/**
 * Initialize a shader program, so WebGL knows how to draw our data
 *
 * @param {WebGLRenderingContext} gl
 * @param  {...WebGLShader} shaders
 * @returns {WebGLProgram}
 */
export function initShaderProgram(gl, ...shaders) {
    /** @type {WebGLProgram|null} */
    const program = gl.createProgram()
    if (program == null) throw new Error('Cannot create webGL program')
    for (const shader of shaders) gl.attachShader(program, shader)
    gl.linkProgram(program)
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program
    throw new Error(gl.getProgramInfoLog(program) || 'Cannot create webGL program (2)')
}

/**
 * Creates a shader of the given type, uploads the source and compiles it.
 *
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param  {...string} sources
 * @returns {WebGLShader}
 */
export function createShader(gl, type, ...sources) {
    /** @type {WebGLShader|null} */
    const shader = gl.createShader(type)
    if (shader == null) throw new Error('Cannot create webGL shader')
    gl.shaderSource(shader, sources.join('\n'))
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
    throw new Error(gl.getShaderInfoLog(shader) || 'Cannot create webGL shader (2)')
}

/**
 * Check if webGL is supported
 *
 * @returns {boolean}
 */
export function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas')
        return !!(!!window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch (err) {
        return false
    }
}
