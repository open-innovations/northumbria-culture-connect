import lume from "lume/mod.ts";
import base_path from "lume/plugins/base_path.ts";
import metas from "lume/plugins/metas.ts";
import jsonLoader from "lume/core/loaders/json.ts";

import oiLumeViz from "https://deno.land/x/oi_lume_viz@v0.16.0/mod.ts";
import autoDependency from 'https://deno.land/x/oi_lume_utils@v0.4.0/processors/auto-dependency.ts';


const site = lume({
    src: './src',
    location: new URL('https://open-innovations.github.io/northumbria-culture-connect/')
});

site.process(['.html'], (pages) => pages.forEach(autoDependency));
site.use(base_path());
site.use(metas());
site.use(oiLumeViz());

site.loadData(['.geojson'], jsonLoader);

export default site;
