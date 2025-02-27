# northumbria-culture-connect

This is the repository for the Northumbria Culture Connect Data Observatory. The
Data Observatory is provided as a static website, which can be hosted using a
simple web server or service such as GitHub pages. This repository contains the
data, templates and assets which will enable you to recreate the Data
Observatory site.

## Static site generation

### Pre-requisites

To get started, clone this site to your build environment. The site build should
be platform agnostic, but we've mostly used **macOS** or **Linux** environments
during development. This includes on Windows machines, where we tend to prefer
[**WSL**](https://learn.microsoft.com/en-us/windows/wsl/install).

_NB_ If using WSL, it's probably worth ensuring that you clone into the WSL
filesystem, rather than using a repository cloned into the Windows directories,
as this can cause problems with file syncing.

We use [Lume](https://lume.land) to build the site. The only dependency for this
is the [Deno](https://deno.land) runtime. Install this using the
[Deno "Getting Started" instructions](https://docs.deno.com/runtime/).

### Building the site

To build the site, ensure that you are in the root directory of the repository
and run the command

```sh
deno task build
```

This will create the files that comprise the site into the `_site`
directory.Transfer this folder to your web server.

The build process has been configured to build a site with a canonical URL of
https://open-innovations.github.io/northumbria-culture-connect/. This affects
some SEO tags and prefixes for absolute URLs. If you are hosting at a different
location, you will need to either
[update the location config, or override the location with the --location flag](https://lume.land/docs/configuration/config-file/#location)
on the site build as follows

TODO Update canonical url in config once known.

```sh
deno task build --location https://my-site.co.uk/ncc
```

### Serving the site

It's possible to serve the site locally using the command

```sh
deno task serve
```

The site will be served at http://localhost:3000/

### Developing the site

Full instructions to develop the site are out of the scope of this brief
document. To get started you will need a good working knowledge of
[Lume](https://lume.land). The documentation is the place to start.

Key concepts to understand are:

- [**Templating**](https://lume.land/docs/getting-started/page-formats/#create-pages-with-vento):
  Pages are defined by templates which specify their content. If you need to
  update the content of a page it will probably be defined in a template. The
  primary templating language is [Vento](https://vento.js.org). We make use of
  _partials_ which are small sections of page which are included in the main
  page via an **include** statement.
- [**Shared data**](https://lume.land/docs/getting-started/shared-data/): Files
  stored in the `_data` directories in the site are available in the build
  context for injection into templates.
- [**Components**](https://lume.land/docs/core/components/): Reusable and
  self-contained chunks of code which render as part of a page. Unlike
  _partials_ these don't have access to the page content.
