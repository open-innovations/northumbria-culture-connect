function initialiseRadialMap(svg: SVGElement) {
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>('.nodes > g'));
    const edges = Array.from(svg.querySelectorAll<SVGPathElement>('.edges path'));

    // Rehydrate the nodes and edges
    edges.forEach(e => e.nodeArray = e.dataset.nodes?.split('|') || []);
    nodes.forEach(n => {
        const id = n.dataset.id!;
        n.edges = edges.filter(e => e.nodeArray.includes(id));
        n.linkedNodes = n.edges.map(e => e.nodeArray).flat().filter(x => x != id).map(id => nodes.find(n => n.dataset.id === id));
    })

    const width = svg.viewBox.baseVal.width / 2;

    const tooltipContainer = document.createElementNS('http://www.w3.org/2000/svg',"foreignObject");
    tooltipContainer.setAttribute('x', -(width / 2));
    tooltipContainer.setAttribute('y', -(width / 2));
    tooltipContainer.setAttribute('width', width);
    tooltipContainer.setAttribute('height', width);

    const tooltip = document.createElement('aside');
    tooltip.classList.add('edge-bundle-tooltip');
    // tooltip.style.background = '#ffffffa0';
    // tooltip.style.padding = '1rem';
    // tooltip.style.textAlign = 'center';
    tooltip.hidden = true;
    
    const tooltipOuter = document.createElement('div');
    tooltipOuter.style.height = '100%';
    tooltipOuter.style.boxSizing = 'border-box';
    tooltipOuter.style.display = 'flex';
    tooltipOuter.style.alignItems = 'center';
    tooltipOuter.style.justifyContent = 'center';

    tooltipOuter.append(tooltip);
    tooltipContainer.append(tooltipOuter);
    svg.append(tooltipContainer);

    let mouseoutTimer: number | undefined = undefined;
    let toggled = false;
    function activate(node) {
        if (toggled) return;
        const title = node.querySelector('title');
        if (mouseoutTimer) {
            clearTimeout(mouseoutTimer);
            mouseoutTimer = undefined;
        }
        tooltip.innerHTML = title?.innerHTML || "";
        node.classList.add('selected');
        node.edges.forEach(e => {
            e.classList.add('selected');
            e.parentNode.appendChild(e);
        });
        node.linkedNodes.forEach(n => n.classList.add('linked'));
        tooltip.hidden = false;
    };
    function deactivate(node) {
        if (toggled) return;
        node.classList.remove('selected');
        node.edges.forEach(e => e.classList.remove('selected'));
        node.linkedNodes.forEach(n => n.classList.remove('linked'));
        mouseoutTimer = setTimeout(() => {
            tooltip.hidden = true;
            tooltip.innerHTML = '';
        }, 250);
    }
    nodes.forEach(n => {
        n.addEventListener('mouseover', function () { activate(this) });
        n.addEventListener('mouseout', function() { deactivate(this) })
        n.addEventListener('click', function() {
            if (toggled) {
                const toggledNode = document.querySelector('.nodes .toggled');
                toggled = false;
                deactivate(toggledNode);
                toggledNode.classList.remove('toggled');
                activate(this);
            } else {
                activate(this);
                toggled = true;
                this.classList.add('toggled');
            }
        })
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const radialGraphs = document.querySelectorAll<SVGElement>('svg.radial')
    for (const g of radialGraphs) {
        initialiseRadialMap(g);
    }
})