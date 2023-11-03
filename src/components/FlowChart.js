import * as joint from 'jointjs';
import React, { useEffect, useRef } from 'react';

function FlowChart({ graphs }) {
    const papers = {};
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            for (let graphName in graphs) {
                const graph = graphs[graphName];
        
                // Create the paper using child div's id
                const paper = new joint.dia.Paper({
                    el: containerRef.current.querySelector(`#${graphName}`),
                    model: graph,
                    gridSize: 10
                });
        
                papers[graphName] = paper;
        
                // Delay to ensure everything is rendered and compute bbox
                setTimeout(() => {
                    const bbox = graph.getBBox();
                    const padding = 60;
                    paper.setDimensions(bbox.width + padding, bbox.height + 20);
                }, 50);
            }
        }
    }, [graphs]);

    const rowStyle = {
        width: '100%',
        overflowX: 'scroll',
        overflowY: 'scroll',
        whiteSpace: 'nowrap',
        marginBottom: '10px'
    };

    return (
        <div ref={containerRef}>
            {Object.keys(graphs).map(graphName => (
                <div key={graphName} id={graphName} style={rowStyle}></div>
            ))}
        </div>
    );
}

export default FlowChart;
