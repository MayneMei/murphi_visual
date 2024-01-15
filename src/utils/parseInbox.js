

export function parseInbox(trace) {
    const sections = trace.split('----------');
    const lastSection = sections[sections.length - 2].trim();
    const blocks = [];
    if (lastSection === "") {
        return []; // Return an empty array if the last section is empty
    }

    const lines = lastSection.split('\n');
    let block = {
        attributes: {}
    };

    lines.forEach(line => {
        // Parse only lines that start with 'InBox'
        if (line.startsWith('InBox')) {
            parseInBox(line, block);
        }
    });

    console.log(block);
    return block;
}

function parseInBox(line, block) {
    // Split the line into key and value
    const [inboxKey, value] = line.split(':').map(s => s.trim());

    // Extract the inbox type, index, and property name
    const inboxMatch = inboxKey.match(/InBox\[([^\]]+)\]\[(\d+)\]\.(\w+)/);
    if (!inboxMatch) {
        return; // If the pattern does not match, skip this line
    }
    const [, inboxType, index, property] = inboxMatch;

    // Ensure the structure for storing inbox data is initialized
    if (!block.attributes[inboxType]) {
        block.attributes[inboxType] = [];
    }

    // Ensure the specific index for this inbox type is initialized
    if (!block.attributes[inboxType][index]) {
        block.attributes[inboxType][index] = {};
    }

    // Store the property and its value
    block.attributes[inboxType][index][property] = value;
}

