import joint from 'jointjs';

function parseTrace(trace) {
    const sections = trace.split('----------');
    const transitions = [];
    
    // Start with the initial state
    let currentState = initializeState(sections[0]);
    const processors = { ...currentState.procs }; // Deep copy to ensure immutability
    let homeNode = { ...currentState.homeNode };

    sections.slice(1, -1).forEach((section) => {
        const lines = section.trim().split('\n');
        
        // Determine if the rule is for a processor or the home node
        const isProcessorRule = lines[0].includes('Proc_');
        const isHomeNodeRule = lines[0].includes('HomeType');
        let procName;

        if (isProcessorRule) {
            procName = lines[0].split(',')[2].split(':')[1].trim();
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
                } else if (isHomeNodeRule && procOrHome === 'HomeType') {
                    homeNode[attribute] = value;
                }
            }
        });

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

    return {
        homeNode: homeNode,
        processors: processors,
        transitions: transitions 
    };
}



function initializeState(startState) {
    const lines = startState.trim().split('\n');
    
    // Default attributes for HomeNode
    const defaultHomeNode = {
        State: undefined,
        Owner: undefined,
        Val: undefined,
        "Order id": undefined
    };

    // Populate HomeNode based on the first 3 lines
    const homeNode = { ...defaultHomeNode };
    homeNode.State = lines[1].split(':')[1];
    homeNode.Owner = lines[2].split(':')[1];
    homeNode.Val = lines[3].split(':')[1];

    // Default attributes for Procs
    const defaultProc = {
        State: undefined,
        Val: undefined,
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
