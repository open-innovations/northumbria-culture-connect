import lume from "lume/mod.ts";

// Lume plugins
import jsonLoader from "lume/core/loaders/json.ts";
import base_path from "lume/plugins/base_path.ts";
import date from 'lume/plugins/date.ts';
import esbuild from 'lume/plugins/esbuild.ts';
import metas from "lume/plugins/metas.ts";
import postcss from 'lume/plugins/postcss.ts';
import sheets from "lume/plugins/sheets.ts";
import svgo from 'lume/plugins/svgo.ts';
import transformImages from 'lume/plugins/transform_images.ts';

// import mermaid from "jsr:@ooker777/lume-mermaid-plugin/";

// OI plugins
import autoDependency from 'https://deno.land/x/oi_lume_utils@v0.4.0/processors/auto-dependency.ts';
import oiLumeViz from "https://deno.land/x/oi_lume_viz@v0.16.2/mod.ts";
import oiVizConfig from "./oi-viz-config.ts"; // Get our OI Lume Viz config

//PostCSS plugins
import nesting from "npm:postcss-nesting";

const site = lume({
    src: './src',
    location: new URL('https://open-innovations.github.io/northumbria-culture-connect/'),
    components: {
        cssFile: '_includes/css/_components.css'
    }
});
site.data('LOCAL', site.options.location.hostname === 'localhost');

site.process(['.html'], (pages) => pages.forEach(autoDependency));
site.use(base_path());
site.use(date());
site.use(postcss({
    plugins: [nesting()],
}));
site.use(metas());
site.use(transformImages());
site.use(svgo());
site.use(oiLumeViz(oiVizConfig));
site.use(sheets({
    options: {
        cellDates: true,
    }
}));

site.use(esbuild({
    extensions: [ '.b.ts' ],
    // options: {
    // }
}));
// site.use(mermaid());

site.loadData(['.geojson'], jsonLoader);

site.filter("toLocaleString", (value) => parseFloat(value).toLocaleString());

site.filter('displayCurrency', (x: string) => parseInt(x)
    .toLocaleString('en-GB', {
        style: "currency",
        currency: 'GBP',
        maximumFractionDigits: 0
    }));

site.copy('assets/fonts/webfonts/');

export default site;
