import lume from "lume/mod.ts";

// Lume plugins
import jsonLoader from "lume/core/loaders/json.ts";
import textLoader from "lume/core/loaders/text.ts";
import base_path from "lume/plugins/base_path.ts";
import date from 'lume/plugins/date.ts';
import esbuild from 'lume/plugins/esbuild.ts';
import metas from "lume/plugins/metas.ts";
import postcss from 'lume/plugins/postcss.ts';
import sheets from "lume/plugins/sheets.ts";
import sitemap from "lume/plugins/sitemap.ts";
import svgo from 'lume/plugins/svgo.ts';
import transformImages from 'lume/plugins/transform_images.ts';
import inline from "lume/plugins/inline.ts";
import redirects from "lume/plugins/redirects.ts"

// import mermaid from "jsr:@ooker777/lume-mermaid-plugin/";

// OI plugins
import autoDependency from 'https://deno.land/x/oi_lume_utils@v0.4.0/processors/auto-dependency.ts';
import oiLumeViz from "https://deno.land/x/oi_lume_viz@v0.16.7/mod.ts";
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

// SEO plugins
site.use(metas());
site.use(sitemap());
site.use(redirects());

// Inline images
site.use(inline({
  copyAttributes: ["title", /^data-/, "style"], // Copy the "title" and all data-* attributes
}));

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
site.loadData(['.text', '.txt', '.md'], textLoader);

site.filter("toLocaleString", (value) => parseFloat(value).toLocaleString());

site.filter('displayCurrency', (x: string) => parseInt(x)
    .toLocaleString('en-GB', {
        style: "currency",
        currency: 'GBP',
        maximumFractionDigits: 0
    }));

site.copy('assets/fonts/webfonts/');
site.copy('assets/vendor/');

site.process(['.html'], (pages) => {
    for (const page of pages) {
        const svgs = page.document?.querySelectorAll<SVGElement>('.oi-waffle-chart svg');
        for (const svg of svgs) {
            // Remove all inline styles!
            svg.removeAttribute('style');
            svg.removeAttribute('width');
            svg.removeAttribute('height');
        }
        page.content;
    }
}) 

site.remoteFile('assets/js/zoomable.js', import.meta.resolve('./patches/zoomable.js'));

// Check missing links in menu
site.process(['.html'], (pages) => {
    const urls = pages.map(p => p.data.url).map(u => site.url(u));
    for (const page of pages) {
        const links = page.document?.querySelectorAll<HTMLAnchorElement>('[data-comp="nav-main-menu"] a');
        for (const link of links!) {
            const href = link.getAttribute("href");
            if (!urls.includes(href)) {
                link.classList.add('missing');
            }
        }
        page.content;
    }
})

// Provision data files
[
    [import.meta.resolve('./data/culture_landscape.csv'), 'regional/culture-sector/data/culture_landscape.csv'],
].forEach(([source, target]) => {
    site.remoteFile(target, source);
    site.copy(target);
});

export default site;
