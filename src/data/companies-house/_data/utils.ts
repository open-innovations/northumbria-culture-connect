type GraphNode = { [k: string]: unknown }
type GraphEdge = { [k: string]: unknown }

type Graph = {
    nodes: GraphNode[],
    edges: GraphEdge[],
}

const splitSic = (x) => x.split(/-/).map(x => x.trim())

export const hierarchify = (graph: Graph) => ({
    name: 'ROOT',
    children: graph.nodes.map(n => ({
        name: splitSic(n.sic_code)[0],
        title: splitSic(n.sic_code)[1],
        r: n.count,
        links: graph.edges
            .filter(e => e.src == n.sic_code)
            .map(e => ({ name: splitSic(e.dst)[0], w: e.weight }))
    })),
}),