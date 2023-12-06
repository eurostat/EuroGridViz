import { Button } from './Button.js'

/**
 * Button for toggling fullscreen mode
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class FullscreenButton extends Button {
    /**
     * @param {Object} opts
     * opts.parentNode - the node that the button is appended to
     * opts.canvas - the gridviz canvas
     * opts.id
     * opts.title - HTML title attribute
     * opts.class - css class
     * opts.onClickFunction
     * opts.x - x position of the button
     * opts.y - y position of the button
     */

    // default state
    isFullscreen = false

    constructor(opts) {
        super(opts)

        // append fullscreen icon to button container
        this.div.node().innerHTML = `
        <svg
            style="height: 1.2rem; width: 1.2rem; fill:black; margin:0;"
            focusable="false"
            aria-hidden="true"
        >
            <svg fill="#000000" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
            <title/>
            <g>
            <path d="M30,0H6A5.9966,5.9966,0,0,0,0,6V30a6,6,0,0,0,12,0V12H30A6,6,0,0,0,30,0Z"/>
            <path d="M90,0H66a6,6,0,0,0,0,12H84V30a6,6,0,0,0,12,0V6A5.9966,5.9966,0,0,0,90,0Z"/>
            <path d="M30,84H12V66A6,6,0,0,0,0,66V90a5.9966,5.9966,0,0,0,6,6H30a6,6,0,0,0,0-12Z"/>
            <path d="M90,60a5.9966,5.9966,0,0,0-6,6V84H66a6,6,0,0,0,0,12H90a5.9966,5.9966,0,0,0,6-6V66A5.9966,5.9966,0,0,0,90,60Z"/>
            </g>
            </svg>
        </svg>
        `

        //save initial app dimensions
        this.defaultHeight = this.app.h
        this.defaultWidth = this.app.w

        // event handler
        this.div.on('click', (e) => {
            this.onClickFunction(e)
        })
        this.div.on('mouseover', (e) => {
            this.style('background-color', 'lightgrey')
        })
        this.div.on('mouseout', (e) => {
            this.style('background-color', '#ffffff')
        })

        //set position
        if (opts.x) {
            this.style('left', opts.x + 'px')
        } else {
            this.style('right', '10px')
        }
        if (opts.y) {
            this.style('top', opts.y + 'px')
        } else {
            this.style('top', '90px')
        }
    }

    onClickFunction(e) {
        if (this.isFullscreen) {
            this.closeFullscreen(this.app.container)
            //resize canvas to default
            this.app.h = this.defaultHeight
            this.app.w = this.defaultWidth
            this.app.cg.h = this.defaultHeight
            this.app.cg.w = this.defaultWidth
            this.app.cg.canvas.setAttribute('width', '' + this.defaultWidth)
            this.app.cg.canvas.setAttribute('height', '' + this.defaultHeight)
            this.app.redraw()
            this.isFullscreen = false
        } else {
            this.openFullscreen(this.app.container)
            //resize canvas to fullscreen
            this.app.h = window.screen.height
            this.app.w = window.screen.width
            this.isFullscreen = true
        }
    }

    /* Open fullscreen */
    openFullscreen(elem) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen()
        } else if (elem.webkitRequestFullscreen) {
            /* Safari */
            elem.webkitRequestFullscreen()
        } else if (elem.msRequestFullscreen) {
            /* IE11 */
            elem.msRequestFullscreen()
        }
    }

    /* Close fullscreen */
    closeFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
            /* Safari */
            document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) {
            /* IE11 */
            document.msExitFullscreen()
        }
    }
}
