import * as d3 from "d3";
import {token_styler, display_token, rgbToLuma} from "./util.js"

export class TextHighlighter {

    constructor(_config = {}) {
        this.config = {
            // Controls for color of background
            bgColorScaler: _config.bgColorScaler ||
                d3.scaleLinear().domain([0.2, 1]).range([0, 0.5]),
            bgColorInterpolator: _config.bgColorInterpolator ||
                d3.interpolateRgb("white", "blue"),

            // Controls for color of token text
            textColorScaler: _config.textColorScaler ||
                d3.scaleLinear()
                    .domain([0,1])
                    .range([0, 1]),
            textColorInterpolator: _config.textColorInterpolator,
            // display the number of the position in sequence. Default true
            showPosition:(typeof _config.showPosition !== "undefined")?
                _config.showPosition : true, // Value could be 'false', this is to accommodate

            overrideTokenBorderColor: _config.overrideTokenBorderColor, // Okay to be undefined

            // The data object will a 'tokens' list and another member e.g. 'attributions'
            // or 'factors'. We declare its name here so we can retrieve the values.
            valuesKey: _config.valuesKey || 'values',

            // Flag used to control highlight animation in bgColor()
            overrideColorParam: false
        }
        this.parentDivId = _config.parentDiv
        this.data = _config.data
        this.count=0;

    }
    init() {
        const self = this
        this.div = d3.select('#' + this.parentDivId)
        if(this.div==null)
            console.log("text_highlighter select id null");
        this.innerDiv = this.div.append('div')
        //console.log("innerdiv"+(this.innerDiv==null))
        this.innerDiv.style('float', 'left')
            .style('float', 'left')
            .style('width', '70%')
        // Show where inputs start
        // this.innerDiv
        //     .insert('div', ':first-child')//Insert at the beginning
        //     .attr('class', 'sequence-indicator inputs-indicator')
        //     .html('input:')

        // Show where the output sequence starts
        this.innerDiv
            .insert('div', '.output-token') //Insert before the first output token
            .attr('class', 'sequence-indicator outputs-indicator')
            .html('>>')
    }


    setupTokenBoxes(tokenData) {
        const self = this

        function transparent_bg(bg_color, opacity=0.6) {
            let rgb_bg = bg_color.split('(')[1].slice(0, -1).split(',')
            let rgb_a_bg = 'rgba(' + [parseInt(rgb_bg[0]).toFixed(2),
                parseInt(rgb_bg[1]).toFixed(2),
                parseInt(rgb_bg[2]).toFixed(2), opacity].join(',') + ')'
            return rgb_a_bg
        }
    

        let token_boxes = this.innerDiv.selectAll('div.token')
        //console.log("token_box"+token_boxes.size())
        if(token_boxes.size()==0){
            token_boxes.data(tokenData, (d, i) => {
                return d['position'] //The position of the token is its key
            })
            .enter().append('div')
                        .attr('token', (d, i) => {
                            return d.token
                        })
                        .attr('id', (d, i) => 't' + i)
                        .attr('position', (d, i) => i)
                        .attr('value', (d, i) => d.value || 0)
                        .style('opacity', 0)
                        .style('background-color', (d, i) => {
                            // console.debug("bg", d, d.value)
                            // return self.bgColor(d)
                            return transparent_bg(self.bgColor(d))
                        })
                        .style('border-color', () => {
                            if (self.config.overrideTokenBorderColor)
                                return self.config.overrideTokenBorderColor
                            // If not set, don't return anything, let it fallback to CSS definition
                        })
                        .call(token_styler)
                        // Set up the children of the box
                        .each(function (d, i) {

                            // Position in the sequence
                            if( self.config.showPosition ){
                                d3.select(this).append('div')
                                    .attr('class', 'position_in_seq')
                                    .text(() => i)
                            }
                            // Token Text
                            d3.select(this).append('span')
                                .text(() => display_token(d.token))
                                .style('color', (d, i) => self.textColor(d.value))
                                .style('padding-left', '4px')

                        })
                        .call(enter => enter.transition().duration(500)
                            .style('opacity', 1))

        }
        else{
            token_boxes
            .data(tokenData, (d, i) => {
                return d['position'] //The position of the token is its key
            })
            .style('background-color', (d) => {
                // return self.bgColor(d)
                return transparent_bg(self.bgColor(d))
            })

        }
    }

    // Get the background
    bgColor(token) {
        // If token explicitly has a color, use that
        // Case: using different colors for different factors in one view
        // console.debug('bgColor',token, (!this.config.overrideColorParam) ,  (token.color !== undefined))
        if ((!this.config.overrideColorParam) && (token.color !== undefined)){
            return token.color
        }
        // If no explicit color, interpolate using value
        else if (token.value !== undefined){

            return this.config.bgColorInterpolator(
                this.config.bgColorScaler(token.value))

        }
        //
        // else
        //     return "white"
    };

    textColor(value) {

        // console.log('textColor', value )
        const scaledValue = this.config.textColorScaler(value)
        if (this.config.textColorInterpolator) {
            // console.log('textColorInterpolator', this.config.textColorInterpolator(scaledValue))
            return this.config.textColorInterpolator(scaledValue)
        }
        // else if (scaledValue > 0.4)
        //     return '#ffffff'
        else
            return '#000000';
    }

    autoTextColor(token){

        let bgColor = this.bgColor(token)

        let luma_ = rgbToLuma(bgColor)

            if (luma_ > 0.5)
                return "black"
            else
                return "white"
        //
        // let hslBGColor = rgbToHsl(bgColor)
        // console.log('BG COLOR!', bgColor, hslBGColor)
        //
        // if (hslBGColor[2] < 0.72)
        //     return "white"
        // else
        //     return "black"
    }

    updateData(id, color = null) {
        console.log('update data', id, color)
        const newValues = this.data[this.config.valuesKey][0][id]

        // let max = this.data['tokens'][0].value
        // Update the 'value' parameter of each token
        // So when self.setupTokenBoxes() is called, it updates
        // whatever depends on 'value' (namely, bar sparkline, and its numeric value)
        for (let i = 0; i < this.data['tokens'].length; i++) {
            this.data['tokens'][i].value = newValues[i] ? newValues[i] : 0
            // if (this.data['tokens'][i].value > max)
            //     max = this.data['tokens'][i].value
        }

        // Update the color scale used to highlight the tokens
        if(color){
            // console.debug('color', color)
            this.config.bgColorInterpolator = d3.interpolateRgb("white", color)
            this.config.bgColorScaler =
                d3.scaleLinear()
                    .domain([0,d3.max(newValues)])
                    .range([0, 1])
        }
    }

    addToken(token){
        this.data['tokens'].push(token)
    }

    redraw(){
        this.setupTokenBoxes(this.data['tokens'])
    }

}
