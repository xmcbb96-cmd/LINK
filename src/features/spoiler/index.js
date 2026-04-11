// 6. 剧透遮罩渲染 
// ==========================================
const initSpoilerEngine = () => {
    const targetDoc = parentWindow.document;
    const process = (root) => {
        const walker = targetDoc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        const nodes = [];
        while (walker.nextNode()) if (walker.currentNode.textContent.includes('||')) nodes.push(walker.currentNode); // 查找包含 || 的节点
        
        nodes.forEach(node => {
            const text = node.textContent; const regex = /\|\|(.+?)\|\|/g;
            if (regex.test(text)) {
                const frag = targetDoc.createDocumentFragment(); let match, last = 0; regex.lastIndex = 0;
                while ((match = regex.exec(text)) !== null) {
                    if (match.index > last) frag.appendChild(targetDoc.createTextNode(text.slice(last, match.index)));
                    const span = targetDoc.createElement('span'); span.className = 'mp-spoiler'; span.textContent = match[1]; // 替换为遮罩 span
                    span.onclick = function() { this.classList.toggle('revealed'); };
                    frag.appendChild(span); last = match.index + match[0].length;
                }
                if (last < text.length) frag.appendChild(targetDoc.createTextNode(text.slice(last)));
                node.parentNode?.replaceChild(frag, node);
            }
        });
    };
    const handler = (mesId) => setTimeout(() => {
        const el = targetDoc.querySelector(`[mesid="${mesId}"] .mes_text`);
        if (el) process(el);
    }, 50);
    onEventTracked(tavern_events.USER_MESSAGE_RENDERED, handler);
    onEventTracked(tavern_events.CHARACTER_MESSAGE_RENDERED, handler);
    setTimeout(() => targetDoc.querySelectorAll('.mes_text').forEach(process), 1000);
};

// ==========================================
