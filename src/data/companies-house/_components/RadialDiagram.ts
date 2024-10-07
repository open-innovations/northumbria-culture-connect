import * as d3 from 'npm:d3@7.9.0';
import { classifyIdentifier } from "npm:meriyah@4.5.0";


function bilink(root) {
    const map = new Map(root.leaves().map(d => [d.data.name, d]));
    for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.links.map(i => [d, map.get(i.name)]);
    for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
    return root;
}

type Hierarchy = {
    name: string;
    children?: Hierarchy[];
    links: {
        name: string;
        [key: string]: unknown;
    }
    [key: string]: unknown;
}

export type HierarchicalEdgeBundleConfig = {
    data: Hierarchy;
    width?: number;
    padding?: number;
    fontSize?: number;
    title?: (n: Hierarchy) => string;
}

export default function ({ config }: Lume.Data & { config: HierarchicalEdgeBundleConfig }) {
    const {
        data,
        width = 800,
        padding = 100,
        fontSize = 10,
        title = (n) => n.data.name,
    } = config;

    const radius = width / 2;

    const tree = d3.cluster().size([2 * Math.PI, radius - padding]);

    const root = tree(bilink(
        d3.hierarchy(data).sort((a, b) => d3.ascending(a.size, b.size) || d3.ascending(a.data.name, b.data.name))
    ))

    const svg = d3.create("svg")
        .classed('radial', true)
        .attr("viewBox", [-width / 2, -width / 2, width, width])
        .attr("style", "max-width: 100%; height: auto;")
        .attr("font-size", fontSize)
        .attr("data-dependencies", "/assets/js/radial-map.b.js");

    const node = svg.append("g")
        .classed('nodes', true)
        .selectAll()
        .data(root.leaves())
        .join("g")
        .attr("fill", "#aaa")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        // TODO make this configurable
        .attr('data-id', d => d.data.name);

    node.append('title').text(title);
    
    node.append("text")
        .attr("text-rendering", "optimizeLegibility")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(d => d.data.name);
    
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
        // .style("mix-blend-mode", "multiply")
        // TODO make this configurable
        .attr("data-nodes", d => d.map(n => n.data.name))
        .attr("d", ([i, o]) => line(i.path(o)));

    return svg.node();
}