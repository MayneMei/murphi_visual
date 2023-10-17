import React, { useState } from 'react';
import FlowChart from './components/FlowChart';
import * as joint from 'jointjs';

function parseTrace(trace) {
  const sections = trace.split('----------');
  const transitions = [];
  
  // Start with the initial state
  let currentState = initializeState(sections[0]);
  const processors = { ...currentState.procs }; // Deep copy to ensure immutability
  let homeNode = { ...currentState.homeNode };

  let currentOrderId = 0;

  sections.slice(1, -1).forEach((section) => {
      const lines = section.trim().split('\n');
      
      currentOrderId += 1;
      // Determine if the rule is for a processor or the home node
      const isProcessorRule = lines[0].includes('Proc_');
      const isHomeNodeRule = lines[0].includes('HomeType');
      let procName;
      if (isProcessorRule) {
          procName = lines[0].split('n:')[1].split(" ")[0].trim();
      }

      lines.slice(1).forEach(line => {
          if (isProcessorRule && line.startsWith(`Procs[${procName}]`)) {
              const attribute = line.split('.')[1].split(':')[0];
              const value = line.split(':')[1].trim();
              if (processors[procName]) {
                  processors[procName][attribute] = value;
              }
          } else if (isHomeNodeRule && line.startsWith('HomeNode')) {
              const attribute = line.split('.')[1].split(':')[0];
              const value = line.split(':')[1].trim();
              homeNode[attribute] = value;
          } else if (line.startsWith('Net[')) {
              const netInfo = line.split('.');
              const procOrHome = netInfo[0].slice(4, -1);
              const attribute = netInfo[1].split(':')[0];
              const value = netInfo[1].split(':')[1].trim();
              
              // Since there are multiple attributes for 'Net', you may need to decide how to store them in the state.
              // Here's an example that assumes you want to store them in the respective processor or HomeNode state:
              if (isProcessorRule && procOrHome === procName) {
                  processors[procName][attribute] = value;
                  processors[procName]["Order id"] = currentOrderId;
              } else if (isHomeNodeRule && procOrHome === 'HomeType') {
                  homeNode[attribute] = value;
                  homeNode["Order id"] = currentOrderId;
              }
          }
      }
      );
      if (isProcessorRule) {
        processors[procName]["Order id"] = currentOrderId;
      } else {
        homeNode["Order id"] = currentOrderId;
      }
      // Capture the transition
      transitions.push({
          action: lines[0].split(',')[0].split(' ')[1],
          from: currentState,
          to: {
              homeNode: { ...homeNode },
              procs: { ...processors }
          }
      });

      currentState = {
          homeNode: { ...homeNode },
          procs: { ...processors }
      };
  });

  const graphs = {};

  let yPosition = 60;
    console.log(processors);
    for (let procName in processors) {
      
        if (!graphs[procName]) {
            graphs[procName] = new joint.dia.Graph();
        }

        const rect = new joint.shapes.standard.Rectangle();
        rect.position(10, 10);
        rect.resize(200, 40);
        rect.attr({
            body: {
                fill: 'blue',
            },
            label: {
                text: procName,
                fill: 'white'
            }
        });
        rect.addTo(graphs[procName]);

          for (let attr in processors[procName]) {
            const text = new joint.shapes.standard.TextBlock();
            text.position(10, yPosition);
            text.resize(200, 40);
            text.attr({
                label: {
                    text: attr + ": " + processors[procName][attr],
                }
            });
            text.addTo(graphs[procName]);
            yPosition += 50;
        }
      
    }

    yPosition = 60;
    if (!graphs['HomeNode']) {
        graphs['HomeNode'] = new joint.dia.Graph();
    }

    const homeRect = new joint.shapes.standard.Rectangle();
    homeRect.position(10, 10);
    homeRect.resize(200, 40);
    homeRect.attr({
        body: {
            fill: 'green',
        },
        label: {
            text: 'HomeNode',
            fill: 'white'
        }
    });
    homeRect.addTo(graphs['HomeNode']);
    console.log(homeNode);
    for (let attr in homeNode) {
      console.log(attr);
      const text = new joint.shapes.standard.TextBlock();
      text.position(10, yPosition);
      text.resize(200, 40);
      text.attr({
          label: {
              text: attr + ": " + homeNode[attr],
          }
      });
      text.addTo(graphs['HomeNode']);
      yPosition += 50;
  }
  
  return {
      homeNode: homeNode,
      graphs: graphs,
      transitions: transitions 
  };

}




function initializeState(startState) {
  const lines = startState.trim().split('\n');
  
  // Default attributes for HomeNode
  const defaultHomeNode = {
      state: undefined,
      owner: undefined,
      val: undefined,
      "Order id": undefined
  };

  // Populate HomeNode based on the first 3 lines
  const homeNode = { ...defaultHomeNode };
  // console.log(lines[1].split(':')[1]);
  // console.log(lines[2].split(':')[1]);
  // console.log(lines[3].split(':')[1]);
  homeNode.state = lines[1].split(':')[1];
  homeNode.owner = lines[2].split(':')[1];
  homeNode.val = lines[3].split(':')[1];
  // console.log(homeNode);

  // Default attributes for Procs
  const defaultProc = {
      state: undefined,
      val: undefined,
      mtype: undefined,
      "Order id": undefined
  };

  // Initialize processors
  const procs = {};
  for(let i=4; i<lines.length; i++) {
      const match = lines[i].match(/Procs\[(Proc_\d+)\]\.(\w+):(.+)/);
      if (match) {
          const procName = match[1];
          const attribute = match[2];
          const value = match[3];
          
          if (!procs[procName]) {
              procs[procName] = { ...defaultProc };
          }
          
          procs[procName][attribute] = value;
      }
  }

  // Combine all in a single state object
  const initialState = {
      homeNode: homeNode,
      procs: procs
  };

  return initialState;
}


function App() {
  const [inputData, setInputData] = useState('');
  const [processors, setProcessors] = useState([]);
  const [graphs, setGraphs] = useState({});
  const handleParseClick = () => {
    const parsedData = parseTrace(inputData);
    setProcessors(parsedData.processors);
    setGraphs(parsedData.graphs);
};


  return (
    <div className="App">
        <textarea 
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
        />
        <button onClick={handleParseClick}>Parse</button>
        <FlowChart graphs={graphs} />
    </div>
);

}

export default App;
