import * as d3 from "d3";
import {token_styler, display_token} from "./util.js"
import {InteractiveTokenSparkbar} from './interactive-token-sparkbar'

export class AttentionTokenSparkbar extends InteractiveTokenSparkbar {
    constructor(_config) {
        _config['tokenSparkbarConfig'] = {
            colorInterpolator:d3.interpolateOranges,
            colorScaler: d3.scaleLinear()
                .domain([0, 0.5])
                .range([0.4, 1.0])
        }

        super(_config)
        this.config.margin=_config.margin ||
                {top: 10, right: 10, bottom: 10, left: 10}

        this.n_layers = _config.data.attentions.length

        this.config.layer_box_height = _config.layer_box_height || 50
        this.config.layer_box_width = _config.layer_box_width || 200
        this.config.space_between_layers = 10

        this.config.height = _config.height ||
            this.n_layers * this.config.layer_box_height +
            this.n_layers * this.config.space_between_layers +
            this.config.margin.top + this.config.margin.bottom
        this.config.width = _config.width ||
            this.config.layer_box_width +
            this.config.margin.left + this.config.margin.right

        this.selectedLayer = 0
        this.selectedToken = this.data.tokens.length-1
    }


    init() {
        this.div = d3.select('#' + this.parentDivId)
        this.innerDiv = this.div.append('div')

        this.layerPickerDiv = this.div.insert('div', ':first-child')
            .style('float', 'left')
            .style('width', this.config.width + 'px')

        this.innerDiv.style('float', 'left')
            .style('float', 'left')
            .style('width', '70%')

        const self = this,
            // Construct token boxes, most of the work is done here
            token_boxes = this.setupTokenBoxes(self.data['tokens'])
        this.setupSequenceIndicators()

        // Setup layer selection pane
        this.setupLayerPicker()
        this.setupInteraction()
        this.hover({position: this.selectedToken})
        this.layerHover(this.selectedLayer)

    }

    setupLayerPicker(){
        const self = this

        this.svg = this.layerPickerDiv.append('svg')
            .attr("viewBox", [0, 0, this.config.width, this.config.height]);

        d3.range(this.n_layers).forEach((i)=>{
            let g = this.svg.append('g')
                .attr('transform', ()=>{
                    return `translate(${self.config.margin.left}, ${i * 
                    (self.config.layer_box_height + self.config.space_between_layers) +
                    self.config.margin.top
                    })`
                })

            g.append('rect')
                .attr('width', this.config.layer_box_width)
                .attr('height', this.config.layer_box_height)
                .attr('rx', 15)
                .attr('rx', 15)
                .attr('class', 'layer-box attn-hoverable-layer')
                .attr('layer_num', i)
                // .style('fill', '#fae6f0')
                // .style('stroke-width', '3px')
                // .style('stroke', '#535860')


            g.append('text')
                .attr('x', this.config.layer_box_width /2)
                .attr('y', this.config.layer_box_height /2)
                .text(()=> "Layer "+i)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style('font-family', "sans-serif")

        })

    }

    // Configure event listeners on the appropriate elements
    // Called in init()
    setupInteraction() {
        const self = this
        // Hover listeners
        this.innerDiv.selectAll('div.token')
            .filter((d)=>{return d.position !== 0})
            .classed('attn-hoverable-token', true)
            .on("mouseenter", (event, d, i) => {
                self.hover(d, i)
            })
            .on("touchstart", (event, d, i) => {
                self.hover(d, i)
            })


        this.layerPickerDiv.selectAll('rect.layer-box')
            .on("mouseenter", function(event, d,i){
                self.layerHover(d3.select(this).attr('layer_num'))
            })
            .on("touchstart", (event, d, i) => {
                self.layerHover(d3.select(this).attr('layer_num'))
            })
    }

    layerHover(layer_num){

        this.selectedLayer = layer_num

        // End highlighting previously highlighted token
        let disableHighlight = this.layerPickerDiv.selectAll(`[highlighted="${true}"]`)
            .classed('attn-hoverable-layer', true)
            .classed('attn-highlighted-layer', false)
            .attr('highlighted', false)

        // Highlight active token
        let s = this.layerPickerDiv.selectAll(`[layer_num="${layer_num}"]`)
            .attr('highlighted', true)
            .classed('attn-hoverable-layer', false)
            .classed('attn-highlighted-layer', true)

        this.updateData(this.selectedToken -1)
        this.setupTokenBoxes(this.data['tokens'])
    }
    hover(d,i){
        this.selectedToken = d.position
        //d is the data of the token being hovered over
        // For attributions, there's one array for each output token.
        // None for input tokens. So output token #4, if the first output token,
        // gets the first attribution.
        const self = this
        let n_input_tokens = self.innerDiv.selectAll('.input-token').size()

        // End highlighting previously highlighted token
        let disableHighlight = self.innerDiv.selectAll(`[highlighted="${true}"]`)
            .classed('attn-hoverable-token', true)
            .classed('attn-highlighted-token', false)
            .attr('highlighted', false)
            // .style('border', '1px dashed purple')
            // .style('background-color', '')

        // Highlight active token
        let s = self.innerDiv.selectAll(`[position="${d.position}"]`)
            .attr('highlighted', true)
            .classed('attn-hoverable-token', false)
            .classed('attn-highlighted-token', true)
            // .style('border', '1px solid #8E24AA')
            // .style('background-color', '#E1BEE7')
        self.updateData(d.position -1)
        self.setupTokenBoxes(self.data['tokens'])
    }


    updateData(attribution_list_id) {

        const newValues = this.data['attentions'][this.selectedLayer][attribution_list_id]

        let max = 0;
        // Update the 'value' parameter of each token
        // So when self.setupTokenBoxes() is called, it updates
        // whatever depends on 'value' (namely, bar sparkline, and its numeric value)
        for (let i = 0; i < this.data['tokens'].length; i++) {
            this.data['tokens'][i].value = newValues[i] ? newValues[i] : 0
            if (this.data['tokens'][i].value > max)
                max = this.data['tokens'][i].value
        }

        // Set the max value as the new top of the domain for the sparkline
        // -- Both for color and for bar height
        this.tokenSparkline.config.colorScaler = d3.scaleLinear()
            .domain([0, max])
            .range(this.tokenSparkline.config.colorScaler.range())
        console.debug('UPDATING DOMAIN', this.tokenSparkline.config.colorScaler.domain())

        this.tokenSparkline.config.normalizeHeightScale = d3.scaleLinear()
            .domain([0, max])
            .range(this.tokenSparkline.config.normalizeHeightScale.range())
    }
}