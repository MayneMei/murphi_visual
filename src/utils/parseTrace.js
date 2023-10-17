function parseTrace(trace) {
    const sections = trace.split('----------');
    const transitions = [];
    
    // Step 1: Initialize processors using the start state section
    const initialState = initializeState(sections[0]);
    const processors = { ...initialState.procs }; // Create a copy to ensure immutability

    // Step 2: Parse the rest of the trace sections
    sections.slice(1, -1).forEach((section, index) => {
        const lines = section.trim().split('\n');
        if (lines[0].startsWith('Rule')) {
            const action = lines[0].split(',')[0].split(' ')[1];
            transitions.push({
                action: action,
                from: processors, // Use the current processors state as from
                to: {} // This will be updated below
            });
        }

        for (let i = 1; i < lines.length; i++) {
            const match = lines[i].match(/Procs\[(Proc_\d+)\]\.(\w+):(.+)/);
            if (match) {
                const procName = match[1];
                const attribute = match[2];
                const value = match[3];
                
                // If the processor exists, update its state
                if (processors[procName]) {
                    processors[procName][attribute] = value;
                }
            }
        }

        if (transitions[index]) {
            transitions[index].to = { ...processors }; // Update the 'to' state in the transition
        }
    });

    return { 
        homeNode: initialState.homeNode,
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
