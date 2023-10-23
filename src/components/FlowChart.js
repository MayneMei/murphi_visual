import * as joint from 'jointjs';
import React from 'react';
import _ from 'lodash';

function FlowChart({ graphs }) {
    const papers = {};

    React.useEffect(() => {
        for (let graphName in graphs) {
            papers[graphName] = new joint.dia.Paper({
                el: document.getElementById(graphName),
                model: graphs[graphName],
                width: 300,
                height: 1200,
                gridSize: 10
            });
        }
    }, [graphs]);

    return (
        <div>
            {Object.keys(graphs).map(graphName => (
                <div key={graphName} id={graphName}></div>
            ))}
        </div>
    );
}

export default FlowChart;