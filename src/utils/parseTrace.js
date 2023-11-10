

export function parseTrace(trace) {
    const sections = trace.split('----------');
    const blocks = [];

    sections.forEach((section, index) => {
        if (section.trim() === "") {
            return; // 跳过空白部分
        }

        const lines = section.trim().split('\n');
        let block = {
            block: index, // 块编号从 0 开始
            attributes: {}
        };

        lines.forEach(line => {
            // 根据行的起始词汇决定如何解析该行
            if (line.startsWith('HomeNode')) {
                parseHomeNode(line, block);
            } else if (line.startsWith('Procs')) {
                parseProcessor(line, block);
            } else if (line.startsWith('InBox')) {
                parseInBox(line, block);
            } else if (line.startsWith('Net')) {
                parseNet(line, block);
            }
        });

        blocks.push(block);
    });
    console.log(blocks);
    return blocks;
}

function parseHomeNode(line, block) {
    // 将行分割为键和值，然后提取属性和值
    const [key, value] = line.split(':').map(s => s.trim());
    const attribute = key.split('.')[1];
    // 确保 HomeNode 对象存在并更新其属性
    block.attributes.HomeNode = block.attributes.HomeNode || {};
    block.attributes.HomeNode[attribute] = value;
}

function parseProcessor(line, block) {
    // 解析处理器行，并将其分割为键和值
    const [procKey, value] = line.split(':').map(s => s.trim());

    // 正则表达式匹配处理器名称，例如 Proc_1, Proc_2
    const procMatch = procKey.match(/\[([^\]]+)\]/);
    if (!procMatch) {
        return; // 如果没有匹配到处理器名称，不进行进一步处理
    }
    const proc = procMatch[1];

    // 提取属性名称，例如 state, val
    const attribute = procKey.split('.').pop();

    // 创建或更新特定处理器的属性
    block.attributes.Procs = block.attributes.Procs || [];
    let procObj = block.attributes.Procs.find(p => Object.keys(p)[0] === proc);
    if (!procObj) {
        procObj = { [proc]: {} };
        block.attributes.Procs.push(procObj);
    }
    procObj[proc][attribute] = value;
}


function parseInBox(line, block) {
    // 解析 InBox 行并分割为键和值
    const [inboxKey, value] = line.split(':').map(s => s.trim());
    const [inbox, attribute] = inboxKey.split('.');
    // 创建或更新特定 InBox 的属性
    block.attributes.InBox = block.attributes.InBox || [];
    let inboxObj = block.attributes.InBox.find(i => Object.keys(i)[0] === inbox);
    if (!inboxObj) {
        inboxObj = { [inbox]: {} };
        block.attributes.InBox.push(inboxObj);
    }
    inboxObj[inbox][attribute] = value;
}

function parseNet(line, block) {
    // 提取并分割行为键和值
    const [netKey, value] = line.split(':').map(s => s.trim());
    // 进一步分割键来获取 Net 的属性和标识
    const [net, attribute] = netKey.split('}').map(s => s.trim());
    const netId = net.split('[')[1].split(']')[0];  // 提取 Proc_1 之类的标识

    // 创建或更新特定 Net 的属性
    block.attributes.Net = block.attributes.Net || [];
    let netObj = block.attributes.Net.find(n => Object.keys(n)[0] === netId);
    if (!netObj) {
        netObj = { [netId]: {} };
        block.attributes.Net.push(netObj);
    }
    netObj[netId][attribute] = value;
}

// export default parseTrace;
