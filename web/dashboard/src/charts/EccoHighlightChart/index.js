import * as d3 from 'd3';
import "./highlight.css"
import { interactiveTokensAndFactorSparklines } from './eccojs/output-sequence'
import React, { useEffect, useState } from 'react';
import { outlinedInputClasses } from '@mui/material';

const css_url = "https://storage.googleapis.com/ml-intro/ecco/html/styles.css";

function EccoHighlightChart({ json_data, width, height }) {


    useEffect(() => {
        draw();
    }, [json_data, width, height]);

    const draw = () => {
        var init = () => {
            d3.select('#css').attr('href', './test.css')
            const viz_id = "viz_" + Math.round(Math.random() * 10000000)
            const div = d3.select('#basic').attr('id', viz_id)
            return viz_id
        }

        var output_config = {
            'hltrCFG': {
                'tokenization_config': {
                    'token_prefix': '##',
                    'partial_token_prefix': ''
                }
            }
        }
        const viz_id = init();
        
        if (json_data) {
            interactiveTokensAndFactorSparklines(viz_id, { json_data }, output_config)
        }
    }

    return (
        <div id="parent">
            <link rel="stylesheet" type="text/css" href={css_url}></link>
            <div id="basic"></div>
            <div id="output-token"></div>
        </div>

    );
}

export default EccoHighlightChart;