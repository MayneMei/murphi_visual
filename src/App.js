import React, { useState } from 'react';
import FlowChart from './components/FlowChart';
import * as joint from 'jointjs';

function parseTrace(trace) {
    const sections = trace.split('----------');
    const transitions = [];
  
    let currentState = initializeState(sections[0]);
    const processors = { ...currentState.procs };
    let homeNode = [...currentState.homeNode];
    let currentOrderId = 0;

    sections.slice(1, -1).forEach((section) => {
        const lines = section.trim().split('\n');
        
        currentOrderId += 1;
        const isProcessorRule = lines[0].includes('Proc_');
        const isHomeNodeRule = lines[0].includes('HomeType');
        let procName;
        if (isProcessorRule) {
            procName = lines[0].split('n:')[1].split(" ")[0].trim();
        }

        if (isProcessorRule && !processors[procName]) {
            processors[procName] = [];
        }
        
        const currentProcessor = {
            state: undefined,
            val: undefined,
            mtype: undefined,
            "Order id": currentOrderId
        };

        const currentHomeNode = {
          state: undefined,
          val: undefined,
          owner: undefined,
          "Order id": currentOrderId
      };
        lines.slice(1).forEach(line => {
            if (isProcessorRule && line.startsWith(`Procs[${procName}]`)) {
                const attribute = line.split('.')[1].split(':')[0];
                const value = line.split(':')[1].trim();
                currentProcessor[attribute] = value;
            } else if (isHomeNodeRule && line.startsWith('HomeNode')) {
                const attribute = line.split('.')[1].split(':')[0];
                const value = line.split(':')[1].trim();
                currentHomeNode[attribute] = value;
            } else if (line.startsWith('Net[')) {
                const netInfo = line.split('.');
                const procOrHome = netInfo[0].slice(4, -1);
                const attribute = netInfo[1].split(':')[0];
                const value = netInfo[1].split(':')[1].trim();
                
                if (isProcessorRule && procOrHome === procName) {
                    currentProcessor[attribute] = value;
                } else if (isHomeNodeRule && procOrHome === 'HomeType') {
                  currentHomeNode[attribute] = value;
                }
            }
        });
        
        if (isProcessorRule) {
            processors[procName].push(currentProcessor);
        } else {
          homeNode.push(currentHomeNode);
        }
        

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
  const getHeight = (length) => 60 + length * 240;

  console.log(processors);
  console.log(homeNode);
  for (let procName in processors) {
      if (!graphs[procName]) {
          graphs[procName] = new joint.dia.Graph();
      }
      let graphHeight = getHeight(processors[procName].length);
      processors[procName].forEach((procInstance, index) => {
          const yPosition = 60 + index * 240; // Adjust this value as per your needs for spacing
          const rect = new joint.shapes.standard.Rectangle();
          rect.position(10, yPosition);
          rect.resize(200, 40);
          rect.attr({
              body: {
                  fill: 'blue',
              },
              label: {
                  text: procName + " #" + (index + 1),
                  fill: 'white'
              }
          });
          rect.addTo(graphs[procName]);
          
          let yOffset = yPosition + 50;
          for (let attr in procInstance) {
              const text = new joint.shapes.standard.TextBlock();
              text.position(10, yOffset);
              text.resize(200, 40);
              text.attr({
                  label: {
                      text: attr + ": " + procInstance[attr],
                  }
              });
              text.addTo(graphs[procName]);
              yOffset += 50;
          }
      });
  }

  let yOffsetGlobal = 60;
  if (!graphs['HomeNode']) {
    graphs['HomeNode'] = new joint.dia.Graph();
  }
  homeNode.forEach((homeNodeInstance, index) => {
    const homeRect = new joint.shapes.standard.Rectangle();
    homeRect.position(10, yOffsetGlobal);
    homeRect.resize(200, 40);
    homeRect.attr({
        body: {
            fill: 'green',
        },
        label: {
            text: 'HomeNode #' + (index + 1),
            fill: 'white'
        }
    });
    homeRect.addTo(graphs['HomeNode']);

    let yOffset = yOffsetGlobal + 50;
    for (let attr in homeNodeInstance) {
        const text = new joint.shapes.standard.TextBlock();
        text.position(10, yOffset);
        text.resize(200, 40);
        text.attr({
            label: { text: attr + ": " + homeNodeInstance[attr],
        }
      });
      text.addTo(graphs['HomeNode']);
        yOffset += 50;
    }
    yOffsetGlobal = yOffset + 10; // Adjust the gap between different homeNode instances
});

  // const homeRect = new joint.shapes.standard.Rectangle();
  // homeRect.position(10, 10);
  // homeRect.resize(200, 40);
  // homeRect.attr({
  //     body: {
  //         fill: 'green',
  //     },
  //     label: {
  //         text: 'HomeNode',
  //         fill: 'white'
  //     }
  // });
  // homeRect.addTo(graphs['HomeNode']);

  // let yOffset = yPosition + 50;
  // for (let attr in homeNode) {
  //     const text = new joint.shapes.standard.TextBlock();
  //     text.position(10, yOffset);
  //     text.resize(200, 40);
  //     text.attr({
  //         label: {
  //             text: attr + ": " + homeNode[attr],
  //         }
  //     });
  //     text.addTo(graphs['HomeNode']);
  //     yOffset += 50;
  // }

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
  const homeNode = [{ ...defaultHomeNode }];

  // console.log(lines[1].split(':')[1]);
  // console.log(lines[2].split(':')[1]);
  // console.log(lines[3].split(':')[1]);
    homeNode[0].state = lines[1].split(':')[1];
    homeNode[0].owner = lines[2].split(':')[1];
    homeNode[0].val = lines[3].split(':')[1];
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
            procs[procName] = [];
          }
          if (!procs[procName][0]) {
            procs[procName][0] = { ...defaultProc };
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
