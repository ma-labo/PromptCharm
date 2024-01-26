import * as d3 from "d3";
import {token_styler, display_token, viridisToWhite} from "./util.js"
import {TextHighlighter} from "./text-highlighter.js"
import {TokenSparkbar} from "./token-sparkbar.js";


export class MinimalHighlighter extends TextHighlighter {
    constructor(_config) {
        // console.log('_config', _config)
        if ("preset" in _config) {
            switch (_config.preset) {
                case "viridis":
                    _config = {..._config, ...viridis_config}
                    break;
                case "purple":
                    _config = {..._config, ...purple_config}
                    break;
            }
            // console.log('Using preset', _config)
        }
        super(_config)
        this.tokenSparkline = new TokenSparkbar(_config['tokenSparkbarConfig'])
    }

    init() {
        this.div = d3.select('#' + this.parentDivId)
        this.innerDiv = this.div.append('div')
            .attr('class', 'minimal')

        const self = this,
            // Construct token boxes, most of the work is done here
            token_boxes = this.setupTokenBoxes(self.data['tokens'])
        this.setupSequenceIndicators()
        this.setupInteraction()

    }

    setupSequenceIndicators() {
        // Input sequence indicator
        // this.inputRow
        //     .insert('div', ':first-child')//Insert at the beginning
        //     .attr('class', 'sequence-indicator inputs-indicator col-sm-2')
        //     .html('input')
        //
        // // Output sequence indicator
        this.innerDiv
            .insert('div', '.output-token') //Insert before the first output token
            .attr('class', 'sequence-indicator outputs-indicator')
            .html('>>')
    }

    setupInteraction() {
        const self = this
        // Hover listeners
        this.innerDiv.selectAll('div.output-token')
            // .style('border', '1px dashed purple')
            .on("mouseenter", (event, d, i) => {
                self.hover(d, i)
            })
            .on("touchstart", (event, d, i) => {
                self.hover(d, i)
            })
    }

    hover(d, i) {
        console.log('hover', d, i)
        //d is the data of the token being hovered over
        // For attributions, there's one array for each output token.
        // None for input tokens. So output token #4, if the first output token,
        // gets the first attribution.
        const self = this
        let n_input_tokens = self.innerDiv.selectAll('.input-token').size()
        // console.debug('hover', d, d.position, i, n_input_tokens, self.innerDiv)
        let disableHighlight = self.innerDiv.selectAll(`[highlighted="${true}"]`)
            // .style('border', '0')
            .classed('selected', false)
            .attr('highlighted', false)
            .style('background-color', '')
        // .style('border-bottom', '')
        // console.log('hover2', self.innerDiv.selectAll(`.token`).filter((d_)=>d_.position == d.position).size())
        let s = self.innerDiv.selectAll(`.token`)
            .filter((d_) => d_.position == d.position)
            .classed('selected', true)
            .attr('highlighted', true)
        // .style('border-bottom', '4px solid black')
        // .style('background-color', '#aaa')
        self.updateData(d.position - n_input_tokens)
        self.setupTokenBoxes(self.data['tokens'])
    }

    selectFirstToken() {
        const firstTokenId = this.innerDiv.select('.output-token').attr('position')
        // console.debug('firstTokenId', firstTokenId)
        this.hover({position: firstTokenId}, 4)
    }

    setupTokenBoxes(tokenData) {
        //
        const self = this
        const bgScaler = d3.scaleLinear()
            .domain([0, 1]) //TODO: Change the domain when the values are set
            .range([1, 0])

        const token_boxes = this.innerDiv.selectAll('div.token')
            .data(tokenData,
                (d, i) => d['position']
            )
            .join(
                enter => self.enter(enter),
                update => self.update(update)
            )

        // const input_token_boxes = this.inputTokensDiv.selectAll('div.token')
        //     .data(tokenData.filter((d) => d.type == "input"),
        //         (d, i) => d['position']
        //     )
        //     .join(
        //         enter => self.enter(enter),
        //         update => self.update(update)
        //     )
        // const output_token_boxes = this.outputTokensDiv.selectAll('div.token')
        //     .data(tokenData.filter((d) => d.type == "output"),
        //         (d, i) => d['position']
        //     )
        //     .join(
        //         enter => self.enter(enter),
        //         update => self.update(update)
        //     )

        // return token_boxes
    }

    enter(selection) {
        // console.log('enter', selection)
        const self = this
        // selection.each(function(d,i){
        selection.append('div')
            .attr('token', (d, i) => {
                return d.token
            })
            .attr('id', (d, i) => 't' + i)
            .attr('position', (d, i) => i)
            .attr('value', (d, i) => d.value || 0)
            .style('color', (d, i) =>
                self.autoTextColor(d))
            .style('background-color', (d) => {
                    // console.log('bggg', d)
                    return self.bgColor(d)
                }
            )
            .call(token_styler)
            .each(function (d) {
                d3.select(this).append('span')
                    .text(function (d) {
                        return display_token(d.token)
                    })
                // .style('margin-left', '-23px') // Makes the text closer to the tiny barchart
                // .style("pointer-events", "none")

                // d3.select(this)
                //     .call(self.tokenSparkline.draw.bind(self.tokenSparkline))
            })
        // })

    }

    update(selection) {
        // console.log('update', selection)
        const self = this
        selection
            .attr('value', (d, i) => d.value || 0)
            .style('background-color', (d) => {
                return self.bgColor(d)
            })
            .selectAll('span')
            .style('color', (d, i) =>
                self.autoTextColor(d))
        // d3.select(this).call(self.tokenSparkline.update.bind(self.tokenSparkline))

    }

    updateData(attribution_list_id) {
        console.log('attribution_list_id', attribution_list_id)

        const newValues = this.data['attributions'][attribution_list_id]
        const self = this;

        let max = 0;
        // Update the 'value' parameter of each token
        // So when self.setupTokenBoxes() is called, it updates
        // whatever depends on 'value' (namely, bar sparkline, and its numeric value)
        for (let i = 0; i < this.data['tokens'].length; i++) {
            this.data['tokens'][i].value = newValues[i] ? newValues[i] : 0
            if (this.data['tokens'][i].value > max)
                max = this.data['tokens'][i].value
        }

        // Normalize the color range so the highest value get the darkest color
        this.config.bgColorScaler = d3.scaleLinear()
            .domain([0, max])
            .range(this.config.bgColorScaler.range())

        // Set the max value as the new top of the domain for the sparkline
        // -- Both for color and for bar height
        this.tokenSparkline.config.colorScaler = d3.scaleLinear()
            .domain([0, max])
            .range(this.tokenSparkline.config.colorScaler.range())
        // console.debug('UPDATING DOMAIN', this.tokenSparkline.config.colorScaler.domain())

        this.tokenSparkline.config.normalizeHeightScale = d3.scaleLinear()
            .domain([0, max])
            .range(this.tokenSparkline.config.normalizeHeightScale.range())
    }
}


// Configurations

// Viridis
const viridis_config = {
    bgColorScaler: d3.scaleLinear()
        .domain([0, 1]) //[0, 0.4]
        .range([1,0]),
    bgColorInterpolator: viridisToWhite()
}

// Purple
const purple_config = {
    bgColorScaler: d3.scaleLinear()
        .domain([0, 0.3])
        .range([0, 1]),
    bgColorInterpolator: d3.interpolateRgb("white", "purple")
}
