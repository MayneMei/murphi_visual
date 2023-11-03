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
            "Order id": currentOrderId,
            actions: isProcessorRule ? lines[0] : undefined
        };

        const currentHomeNode = {
          state: undefined,
          val: undefined,
          owner: undefined,
          "Order id": currentOrderId,
          actions: isHomeNodeRule ? lines[0] : undefined
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

  const getMessageColor = (message) => {
    if (message.includes("request")) {
      return 'yellow';
    } else if (message.includes("forward")) {
      return 'green';
    } else if (message.includes("receive-net")) {
      return 'red';
    }
    return 'white';
  };

//   console.log(processors);
//   console.log(homeNode);
  for (let procName in processors) {
    if (!graphs[procName]) {
        graphs[procName] = new joint.dia.Graph();
    }
    processors[procName].forEach((procInstance, index) => {
        const xPosition = 60 + index * 600; 
        const rect = new joint.shapes.standard.Rectangle();
        rect.position(xPosition, 10);
        rect.resize(40 + Object.keys(procInstance).length * 20, 200);
        rect.attr({
            body: {
                fill: 'blue',
            },
            label: {
                text: procName + " #" + (index + 1) + "\n" + 
                Object.entries(procInstance)
                      .filter(([key]) => key !== 'actions')
                      .map(([key, value]) => key + ": " + value).join('\n'),
          fill: 'white',
            }
        });
        rect.addTo(graphs[procName]);
        processors[procName][index].id = rect.id;
        if (index > 0) {
            const link = new joint.shapes.standard.Link();
            link.source({ id: processors[procName][index - 1].id });
            link.target({ id: rect.id });
            const actionText = procInstance.actions; // Replaced the conditional check with just procInstance.action
            const messageColor = getMessageColor(actionText); // get color based on message type
            link.labels([{
                attrs: { 
                    text: { text: Object.entries(procInstance)
                        .filter(([key]) => key === 'actions' || key === "Order id")
                        .map(([key, value]) => key + ": " + value).join('\n'), },
                    rect: { fill: messageColor } 
                }
            }]);
            link.addTo(graphs[procName]);
        }
    });
}

let xOffsetGlobal = 60;
if (!graphs['HomeNode']) {
  graphs['HomeNode'] = new joint.dia.Graph();
}
homeNode.forEach((homeNodeInstance, index) => {
    let attributesText = 'HomeNode #' + (index + 1) + "\n";
    for (let attr in homeNodeInstance) {
        if(attr !== 'actions') {
            attributesText += attr + ": " + homeNodeInstance[attr] + "\n";
        }    
    }

    const homeRect = new joint.shapes.standard.Rectangle();
    homeRect.position(xOffsetGlobal, 10);
    homeRect.resize(40 + Object.keys(homeNodeInstance).length * 20, 200); // 20 is estimated height per attribute line
    homeRect.attr({
        body: {
            fill: 'green',
        },
        label: {
            text: attributesText,
            fill: 'white'
        }
    });
    homeRect.addTo(graphs['HomeNode']);
    homeNode[index].id = homeRect.id;
    if (index > 0) {
        const link = new joint.shapes.standard.Link();
        link.source({ id: homeNode[index - 1].id });
        link.target({ id: homeRect.id });
        const actionText = homeNodeInstance.actions;
        const messageColor = getMessageColor(actionText); // get color based on message type
        link.labels([{
          attrs: { 
            text: { text: Object.entries(homeNodeInstance)
                .filter(([key]) => key === 'actions' || key === "Order id")
                .map(([key, value]) => key + ": " + value).join('\n'), },
            rect: { fill: messageColor } 
          }
        }]);
        link.addTo(graphs['HomeNode']);
    }
    xOffsetGlobal = xOffsetGlobal + 600; // Adjust the gap between different homeNode instances
});

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
      "Order id": undefined,
      actions: undefined
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
      "Order id": undefined,
      actions:undefined
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
