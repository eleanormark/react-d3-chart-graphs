import React, {Component} from 'react';
import {scaleBand, scaleLinear} from 'd3-scale';
import {interpolateLab} from 'd3-interpolate';
import throttle from 'lodash.throttle';

import Axes from '../Axes';
import Whisker from '../BoxPlotItem';
import ResponsiveWrapper from '../ResponsiveWrapper';

const COLOR_SCALE_MIN_DEFAULT = '#B2EBF2';
const COLOR_SCALE_MAX_DEFAULT = '#00BCD4';

class BoxPlot extends Component {
    xScale = scaleBand();
    yScale = scaleLinear();
    handleBarHover = this.props.handleBarHover ? this.props.handleBarHover.bind(null) : () => {};

    handleMouseMoveThrottled = throttle((item) => {
        const datum = JSON.parse(item);

        if (datum && datum.title !== this.casheBarHovered) {
            this.casheBarHovered = datum.title;
            this.handleBarHover(datum);
        } else if (datum === null && this.casheBarHovered !== null) {
            this.casheBarHovered = datum;
            this.handleBarHover(datum);
        }
    }, 50);

    handleMouseMove = (event) => {
        this.handleMouseMoveThrottled(event.target.getAttribute('data-datum'));
    };

    handleBarClick = (event) => {
        this.props.handleBarClick(JSON.parse(event.target.getAttribute('data-datum')));
    };

    render() {
        const {data, paddingMultiplier, axesProps, margins, colorScale} = this.props;
        const {legend, padding, ticksCount, tickFormat} = axesProps;
        const defaultPaddingMultiplier = 0;
        const defaultMargins = {top: 10, right: 10, bottom: 150, left: 80};
        const canvasMargins = margins || defaultMargins;
        const svgDimensions = {
            width: Math.max(this.props.parentWidth, 300),
            height: 500,
        };

        let maxValue = Math.max(...data.reduce((result, values) => {
            result.push((values.values.ejection && values.values.ejection.max) || values.values.max);

            return result;
        }, []));

        if (!isFinite(maxValue)) {
            maxValue = 0;
        }

        const xScale = this.xScale
            .padding(paddingMultiplier || defaultPaddingMultiplier)
            .domain(data.map(d => d.title))
            .range([canvasMargins.left, svgDimensions.width - canvasMargins.right]);

        const yScale = this.yScale
            .domain([0, maxValue])
            .range([svgDimensions.height - canvasMargins.bottom, canvasMargins.top])
            .nice(4);

        const colorScaleInterpolate = scaleLinear()
            .domain([0, maxValue])
            .range([colorScale && colorScale.min || COLOR_SCALE_MIN_DEFAULT,
                colorScale && colorScale.max || COLOR_SCALE_MAX_DEFAULT])
            .interpolate(interpolateLab);

        const whiskers = data.map(datum =>
            <Whisker
                key={datum.title}
                isClickable={!!this.props.handleBarClick}
                scales={{xScale, yScale}}
                margins={canvasMargins}
                datum={datum}
                maxValue={maxValue}
                colorScale={colorScaleInterpolate}
                svgDimensions={svgDimensions} />
        );

        return (
            <svg
                onMouseMove={this.props.handleBarHover ? this.handleMouseMove : undefined}
                onClick={this.props.handleBarClick ? this.handleBarClick : undefined}
                width={svgDimensions.width}
                height={svgDimensions.height}>
                <Axes
                    scales={{xScale, yScale}}
                    padding={padding}
                    margins={canvasMargins}
                    ticksCount={ticksCount}
                    tickFormat={tickFormat}
                    svgDimensions={svgDimensions}
                    legend={legend} />
                {whiskers}
            </svg>
        );
    }
}

export default ResponsiveWrapper(BoxPlot);