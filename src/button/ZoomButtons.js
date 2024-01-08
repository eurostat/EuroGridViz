import { Button } from './Button.js'

/**
 * Button for toggling fullscreen mode
 *
 * @module button
 * @author Joseph Davies, Julien Gaffuri
 */
export class ZoomButtons extends Button {
    /**
     * @param {Object} opts
     */
    constructor(opts) {
        super(opts)

        this.onZoom = opts.onZoom // custom user event handler
        this.delta = opts.delta || 0.2

        // zoom in btn
        this.zoomInBtn = document.createElement('a')
        this.zoomInBtn.innerHTML = `<a id="zoomin" class="gridviz-zoom-button" title="Zoom in">+</a>`
        this.zoomInBtn.title = 'Zoom in'
        this.zoomInBtn.addEventListener('click', (e) => {
            this.zoomIn(e)
        })
        this.zoomInBtn.addEventListener('mouseover', (e) => {
            this.zoomInBtn.style.backgroundColor = 'lightgrey'
        })
        this.zoomInBtn.addEventListener('mouseout', (e) => {
            this.zoomInBtn.style.backgroundColor = '#ffffff'
        })

        // zoom out btn
        this.zoomOutBtn = document.createElement('a')
        this.zoomOutBtn.innerHTML = `<a id="zoomin" class="gridviz-zoom-button" title="Zoom out">-</a>`
        this.zoomOutBtn.title = 'Zoom out'
        this.zoomOutBtn.addEventListener('click', (e) => {
            this.zoomOut(e)
        })
        this.zoomOutBtn.addEventListener('mouseover', (e) => {
            this.zoomOutBtn.style.backgroundColor = 'lightgrey'
        })
        this.zoomOutBtn.addEventListener('mouseout', (e) => {
            this.zoomOutBtn.style.backgroundColor = '#ffffff'
        })

        //set styles
        let btns = [this.zoomInBtn, this.zoomOutBtn]
        btns.forEach((btn, i) => {
            btn.style.alignItems = 'center'
            btn.style.justifyContent = 'center'
            btn.style.display = 'flex'
            btn.style.border = 'none'
            btn.style.color = 'black'
            btn.style.textAlign = 'center'
            btn.style.textDecoration = 'none'
            btn.style.padding = '4px'
            btn.style.fontSize = '20px'
            btn.style.fontWeight = 'bold'
            btn.style.userSelect = 'none'
            if (i == 0) btn.style.borderBottom = '1px solid grey'
        })

        // unset parent class height and display for dual buttons
        this.style('height', 'unset')
        this.style('display', 'unset')

        //set position
        if (opts.x) {
            this.style('left', opts.x + 'px')
        } else {
            this.style('right', '10px')
        }
        if (opts.y) {
            this.style('top', opts.y + 'px')
        } else {
            this.style('top', '10px')
        }

        // append to button container
        this.div.node().appendChild(this.zoomInBtn)
        this.div.node().appendChild(this.zoomOutBtn)
    }

    /* Zoom in */
    zoomIn(e) {
        this.map.setZoom(this.map.getZoom() * (1 - this.delta)).redraw()
        if (this.onZoom) this.onZoom(e)
    }

    /* Zoom out */
    zoomOut(e) {
        this.map.setZoom(this.map.getZoom() * (1 + this.delta)).redraw()
        if (this.onZoom) this.onZoom(e)
    }
}
