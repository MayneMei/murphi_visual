

export function parseTrace(trace) {
    const sections = trace.split('----------');
    const blocks = [];

    sections.forEach((section, index) => {
        if (section.trim() === "") {
            return; 
        }

        const lines = section.trim().split('\n');
        let block = {
            block: index,
            attributes: {}
        };

        lines.forEach(line => {
            if (line.startsWith('HomeNode')) {
                parseHomeNode(line, block);
            } else if (line.startsWith('Procs')) {
                parseProcessor(line, block);
            } 
            else if (line.startsWith('Net')) {
                parseNet(line, block);
            }
        });

        blocks.push(block);
    });
    return blocks;
}

function parseHomeNode(line, block) {
    const [key, value] = line.split(':').map(s => s.trim());
    const attribute = key.split('.')[1];
    block.attributes.HomeNode = block.attributes.HomeNode || {};
    block.attributes.HomeNode[attribute] = value;
}

function parseProcessor(line, block) {
    const [procKey, value] = line.split(':').map(s => s.trim());

    const procMatch = procKey.match(/\[([^\]]+)\]/);
    if (!procMatch) {
        return;
    }
    const proc = procMatch[1];
    const attribute = procKey.split('.').pop();

    block.attributes.Procs = block.attributes.Procs || [];
    let procObj = block.attributes.Procs.find(p => Object.keys(p)[0] === proc);
    if (!procObj) {
        procObj = { [proc]: {} };
        block.attributes.Procs.push(procObj);
    }
    procObj[proc][attribute] = value;
}

function parseNet(line, block) {
    const [netKey, value] = line.split(':').map(s => s.trim());
    const [net, attribute] = netKey.split('}').map(s => s.trim());
    const netId = net.split('[')[1].split(']')[0];

    block.attributes.Net = block.attributes.Net || [];
    let netObj = block.attributes.Net.find(n => Object.keys(n)[0] === netId);
    if (!netObj) {
        netObj = { [netId]: {} };
        block.attributes.Net.push(netObj);
    }
    netObj[netId][attribute] = value;
}
