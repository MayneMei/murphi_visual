import React, { useState } from 'react';
import FlowChart from './components/FlowChart';
import { parseTrace } from './utils/parseTrace';
import { parseInbox } from './utils/parseInbox';
import * as joint from 'jointjs';


function ParseBlock(trace, inbox) {
    console.log(trace[0]);
    console.log("INBOX");
    console.log(inbox);
    let currentState = initializeState(trace[0]);

    // const transitions = [];
    const processors = { ...currentState.procs };

    let homeNode = [...currentState.homeNode];
    
    for(let i = 1; i < trace.length; i++){
        let block = trace[i]['block'];
        if(trace[i]['attributes']['HomeNode'].state != homeNode[homeNode.length - 1].state){
            homeNode[homeNode.length] = { state: trace[i]['attributes']['HomeNode'].state, 
                                            owner:trace[i]['attributes']['HomeNode'].owner,
                                            val: trace[i]['attributes']['HomeNode'].val,
                                            'Order id': block
        };
        }
        let procsArray = trace[i]['attributes']['Procs'];
        
        for(let j = 0; j < procsArray.length; j++){
            const procName = Object.keys(procsArray[j])[0];
            let processor = processors[procName];
            let block_state = trace[i]['attributes']['Procs'][j][procName].state;
            let block_val = trace[i]['attributes']['Procs'][j][procName].val;
            if(processor[processor.length - 1].state != block_state){ 
                processor[processor.length] = {state: block_state, val: block_val, 'Order id':block};
            }
        }
    }

  // --------------- add graphs and links

  const graphs = {};

  const getMessageColor = (message) => {
    if (message.includes("ReadReq")) {
      return 'yellow';
    } else if (message.includes("ReadAck")) {
      return 'green';
    } else if (message.includes("RecallReq")) {
      return 'red';
    } else if (message.includes("WBReq")) {
        return 'blue';
    } else if (message.includes("WBReq")) {
        return 'WBAck';
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
        rect.resize(60 + Object.keys(procInstance).length * 20, 200);
        rect.attr({
            body: {
                fill: 'blue',
            },
            label: {
                text: procName + " #" + (index + 1) + "\n" + 
                Object.entries(procInstance)
                      .map(([key, value]) => key + ": " + value).join('\n'),
          fill: 'white',
            }
        });
        rect.addTo(graphs[procName]);

        var actionText;
        var source;
        var orderID;

        if(trace[processors[procName][index]['Order id']].block > 0){
            if(trace[processors[procName][index]['Order id'] - 1] && 
            trace[processors[procName][index]['Order id'] - 1].attributes &&
            Array.isArray(trace[processors[procName][index]['Order id'] - 1].attributes.Net) &&
            trace[processors[procName][index]['Order id'] - 1].attributes.Net.length > 0){
                let net = trace[processors[procName][index]['Order id'] - 1].attributes.Net[0];
                let key = Object.keys(net)[0];
                actionText = net[key][".mtype"];
                source = net[key][".src"];
                orderID = processors[procName][index]['Order id'] - 1;
            } else {
                let net = trace[processors[procName][index]['Order id']].attributes.Net[0];
                let key = Object.keys(net)[0];
                actionText = net[key][".mtype"];
                source = net[key][".src"];
                orderID = processors[procName][index]['Order id'];
            }
        }

        processors[procName][index]['Order id'] = rect.id;

        if (index > 0) {
            const link = new joint.shapes.standard.Link();
            link.source({ id: processors[procName][index - 1]['Order id'] });
            link.target({ id: rect.id });
            const messageColor = getMessageColor(actionText); // get color based on message type
            link.labels([{
                attrs: { 
                    text: { text: `Action: ${actionText}\nSource: ${source}\n Order Id ${orderID}` },
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
    var actionText;
    var source;
    var orderID;
    console.log("trace[homeNodeInstance['Order id']");
    console.log(homeNodeInstance['Order id']);
    if(trace[homeNodeInstance['Order id']].block > 0){
        if(trace[homeNodeInstance['Order id'] - 1] && 
        trace[homeNodeInstance['Order id'] - 1].attributes &&
        Array.isArray(trace[homeNodeInstance['Order id'] - 1].attributes.Net) &&
        trace[homeNodeInstance['Order id'] - 1].attributes.Net.length > 0){
            let net = trace[homeNodeInstance['Order id'] - 1].attributes.Net[0];
            let key = Object.keys(net)[0];
            actionText = net[key][".mtype"];
            source = net[key][".src"];
            orderID = homeNodeInstance['Order id'] - 1;
        } else {
            let net = trace[homeNodeInstance['Order id']].attributes.Net[0];
            let key = Object.keys(net)[0];
            actionText = net[key][".mtype"];
            source = net[key][".src"];
            orderID = homeNodeInstance['Order id'];
        }
    }
    homeNode[index].id = homeRect.id;
    if (index > 0) {
        const link = new joint.shapes.standard.Link();
        link.source({ id: homeNode[index - 1].id });
        link.target({ id: homeRect.id });
        const messageColor = getMessageColor(actionText); // get color based on message type
        link.labels([{
            attrs: { 
                text: { text: `Action: ${actionText}\nSource: ${source}\nOrder Id: ${orderID}` },
                rect: { fill: messageColor } 
            }
        }]);
        link.addTo(graphs['HomeNode']);
    }
    xOffsetGlobal = xOffsetGlobal + 600; // Adjust the gap between different homeNode instances
});


    if (!graphs['Inbox']) {
        graphs['Inbox'] = new joint.dia.Graph();
    }

    const inboxLabel = new joint.shapes.standard.TextBlock();
    inboxLabel.position(60); 
    inboxLabel.resize(200, 40); // Resize as needed
    inboxLabel.attr({
        body: {
            fill: 'transparent'
        },
        label: {
            text: 'Current Message Queue',
            fill: 'black',
            fontSize: 14,
            fontWeight: 'bold'
        }
    });
    inboxLabel.addTo(graphs['Inbox']);

    let xOffset = 60;
    let yOffset = 60;
    Object.keys(inbox.attributes).forEach((inboxType, typeIndex) => {
        // Same Y-offset for all messages within an inbox type
        let yOffsetInboxType = yOffset + (typeIndex * 100); // Adjust spacing between each inbox type
    
        inbox.attributes[inboxType].forEach((message, messageIndex) => {
            const messageText = inboxType + `   Message ${messageIndex + 1}: ` +
                                `${Object.entries(message).map(([key, value]) => `${key}: ${value}`).join(', ')}`;
    
            const messageRect = new joint.shapes.standard.Rectangle();
            messageRect.position(xOffset + (messageIndex * 350), yOffsetInboxType); // Increment X-offset for each message
            messageRect.resize(300, 60); // Adjust size to fit content
            messageRect.attr({
                body: {
                    fill: 'lightblue',
                },
                label: {
                    text: messageText,
                    fill: 'black',
                    fontSize: 14,
                    textWrap: {
                        width: -10, // Padding within the rectangle
                        height: 'auto', // Auto-wrap text by height
                        ellipsis: true // Use an ellipsis if the text is too long
                    }
                }
            });
            messageRect.addTo(graphs['Inbox']);
        });
    
        // No need to adjust yOffset here because we want a horizontal layout
    });
    

  return {
        graphs: graphs,
    //   transitions: transitions 
  };
}




function initializeState(startState) {
  
  // Default attributes for HomeNode
  const defaultHomeNode = {
      state: undefined,
      owner: undefined,
      val: undefined,
      "Order id":startState['block']
  };

  // Populate HomeNode based on the first 3 lines
  const homeNode = [{ ...defaultHomeNode }];

  // console.log(lines[1].split(':')[1]);
  // console.log(lines[2].split(':')[1]);
  // console.log(lines[3].split(':')[1]);
    homeNode[0].state = startState['attributes']['HomeNode'].state;
    homeNode[0].owner = startState['attributes']['HomeNode'].owner;
    homeNode[0].val = startState['attributes']['HomeNode'].val;
    homeNode[0]['Order id'] = startState['block'];
  // console.log(homeNode);
  console.log(homeNode);
//   // Default attributes for Procs
    const defaultProc = {
        state: undefined,
        val: undefined,
        "Order id": startState['block'],
    };

//   // Initialize processors
    const procs = {};
    const procsArray = startState['attributes']['Procs'];
    for(let i =0; i < startState['attributes']['Procs'].length; i++){
        const procName = Object.keys(procsArray[i])[0];
        if (!procs[procName]) {
            procs[procName] = []; // Initialize as an array if not present
        }
        procs[procName][0] = { ...defaultProc };
        procs[procName][0].state = procsArray[i].state;
        procs[procName][0].val = procsArray[i].val;
        procs[procName][0]['Order id'] = startState['block'];
    }

//   // Combine all in a single state object
    const initialState = {
        homeNode: homeNode,
        procs: procs
    };
    console.log(initialState);
    return initialState;
}


function App() {
    const [inputData, setInputData] = useState('');
    const [graphs, setGraphs] = useState({});

    const handleParseClick = () => {
        const parsedBlock = parseTrace(inputData);
        const parsedInbox = parseInbox(inputData); // Parse the inbox data

        // Process the trace and inbox data
        const parsedData = ParseBlock(parsedBlock, parsedInbox);

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

