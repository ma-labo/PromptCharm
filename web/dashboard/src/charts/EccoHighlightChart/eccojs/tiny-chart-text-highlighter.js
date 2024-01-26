import * as d3 from "d3";
import {token_styler, display_token} from "./util.js"
import {TextHighlighter} from "./text-highlighter.js"
import {TinyChart} from "./tiny-chart";

export class TinyChartTextHighlighter extends TextHighlighter {
    constructor(_config) {
        super(_config)

        this.textColor = function (value) {
            if (this.scale(value) > 0.7)
                return '#ffffff'
            else
                return '#000000'
        }
    }

    init(){
        
    }

    textHighlighter(selection) {
        const self = this, tinyChart1 = new TinyChart()
        selection.each(function (d, i) {
            // console.log(33, d, this)
            // d is a list of objects, each with properties 'token' and 'value'
            // Bind token data to tokens, set token text
            let token_boxes = d3.select(this).selectAll('div')
                .data(d, d => d['position'])
                .join(enter => enter.append('div')
                        .style("background-color", "green"),
                    update =>update.style("background-color", "red")
                    )
                .attr('token', (d, i) => {
                    return d.token
                })
                .attr('id', (d, i) => 't' + i)
                .attr('class', 'token')
                .attr('position', (d, i) => i)
                .attr('value', (d, i) => d.value || 0)
                // .style('background-color', (d, i) => {
                //     // console.log("9", this, self);
                //     self.bgColor(d.value)
                // })
                .style('color', (d, i) =>
                    self.textColor(d.value))
                .call(token_styler, d.token) // Add appropriate CSS classes (new line, partial token)


            // # position in the sequence
            // token_boxes
            //     .data(d)
            //     .append('div')
            //     .attr('class', 'position_in_seq')
            //     .text((d,i) => i)

            // Token text
            token_boxes.append('span')
                .data(d=>d)
                .text(function (d) {
                return display_token(d.token)
            })
                .style('margin-left', '-13px') // Makes the text closer to the tiny barchart
                .style("pointer-events", "none")
            // Tiny bar chart
            token_boxes
                .data(d=>d)
                .call(tinyChart1.tinyChart.bind(tinyChart1))



            // Input sequence indicator
            d3.select(this)
                .insert('div', ':first-child')//Insert at the beginning
                .attr('class', 'sequence-indicator inputs-indicator')
                .html('input:')

            // Output sequence indicator
            d3.select(this)
                .insert('div', '.output-token') //Insert before the first output token
                .attr('class', 'sequence-indicator outputs-indicator')
                .html('output:')
        })
    }
}