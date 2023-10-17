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

// React Component
class TraceParser extends React.Component {
    constructor(props) {
        super(props);
        const startState = "..."; // Your start state string goes here
        this.state = initializeState(startState);
    }

    render() {
        return (
            <div>
                {/* Render your component UI here */}
            </div>
        );
    }
}
