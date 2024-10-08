/**
 * Implementation of Bilevel Edge Bundling from https://observablehq.com/@d3/bilevel-edge-bundling?collection=@d3/d3-hierarchy
 */
import * as d3 from 'npm:d3@7.9.0';

type Hierarchy = {
    id: string;
    children?: Hierarchy[];
    targets: string[];
    [key: string]: unknown;
}

type GraphData = {
    nodes: { id?: string, group?: string; targets?: string[]; [k: string]: unknown; }[],
    edges: { source: string; target: string; [k: string]: unknown; }[]
}

export type HierarchicalEdgeBundleConfig = {
    data: GraphData;
    idField?: string;
    groupField?: string;
    width?: number;
    padding?: number;
    fontSize?: number;
    label?: (n: Hierarchy) => string;
    title?: (n: Hierarchy) => string;
}

function hierarchify(graph: GraphData, options: { idField?: string; groupField?: string; }) {
    const {
        idField = 'id',
        groupField = 'group'
    } = options;
    const nodes = graph.nodes.map(n => ({ ...n, id: n[idField], group: n[groupField] }));
    const edges = graph.edges;
    
    const groupById = new Map;
    const nodeById = new Map(nodes.map(node => [node.id, node]));

    for (const node of nodes) {
        // TODO Remove this once group set
        node.group = 'UNGROUPED';
        let group = groupById.get(node.group);
        if (!group) groupById.set(node.group, group = { id: node.group, children: [] });
        group.children.push(node);
        node.targets = [];
    }

    for (const { source: sourceId, target: targetId } of edges) {
        nodeById.get(sourceId)!.targets!.push(targetId);
    }

    return { children: [...groupById.values()]}
}

function bilink(root) {
    const map = new Map(root.leaves().map(d => [d.data.id, d]));
    for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.targets.map(i => [d, map.get(i)]);
    for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
    return root;
}

export default function ({ config }: Lume.Data & { config: HierarchicalEdgeBundleConfig }) {
    const {
        data,
        idField,
        groupField,
        width = 800,
        padding = 100,
        fontSize = 10,
        label = (n) => n.data.id,
        title = (n) => n.data.id,
    } = config;

    const hierarchy = hierarchify(data, { idField, groupField });

    const radius = width / 2;

    const tree = d3.cluster().size([2 * Math.PI, radius - padding]);

    const root = tree(bilink(
        d3.hierarchy(hierarchy).sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.id, b.data.id))
    ));

    const svg = d3.create("svg")
        .classed('radial', true)
        .attr("viewBox", [-width / 2, -width / 2, width, width])
        .attr("style", "max-width: 100%; height: auto;")
        .attr("font-size", fontSize)
        .attr("data-dependencies", "/assets/js/edge-bundle.b.js");

    const node = svg.append("g")
        .classed('nodes', true)
        .selectAll()
        .data(root.leaves())
        .join("g")
        .attr("fill", "#aaa")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .attr('data-id', d => d.data.id);

    node.append('title').text(title);
    
    node.append("text")
        .attr("text-rendering", "optimizeLegibility")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(label);
    
    const line = d3.lineRadial()
        .curve(d3.curveBundle.beta(0.2))
        .radius(d => d.y)
        .angle(d => d.x);

    const link = svg.append("g")
        .attr("stroke", '#aaa')
        .attr("fill", "none")
        .classed("edges", true)
        .selectAll()
        .data(root.leaves().flatMap(leaf => leaf.outgoing))
        .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("data-nodes", d => d.map(n => n.data.id).join('|'))
        .attr("d", ([i, o]) => line(i.path(o)));

    return svg.node();
}