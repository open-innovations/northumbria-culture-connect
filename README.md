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

## Running the pipelines

The data pipelines are defined in the `pipelines` folder, and are a mixture of
Python scripts and Jupyter notebooks. These make broad use of Python libraries
such as PETL and Pandas to process the data.

### Pre-requisites

You will need a working version of [Python](https://python.org/) installed. We
have used Python 3.12 in the development. Dependencies (including Python
version) are managed via [Pipenv](https://pipenv.pypa.io/en/latest/). Install
this by following the instructions in the Pipenv documentation.

Once installed, set install the dependencies by running:

```sh
pipenv install
```

If for some reason the dependencies change, you can make sure you're up to date
by running

```sh
pipenv sync
```

To ensure the scripts run properly you will also need to set the
[PYTHONPATH](https://docs.python.org/3/library/sys_path_init.html) to point to
the `pipelines` folder of this repository. This can be added to a `.env` file in
this directory (which is set to be ignored by Git). On a macOS/Linux/WSL
environment the following command will do this, assuming run from the project
root:

```sh
echo PYTHONPATH=${PWD}/pipelines > .env
```

You can now start an environment with all required python modules by running:

```sh
pipenv shell
```

### Running the pipelines

Having run the `pipenv shell` command and started a shell, change directory into
the `piplines` directory.

Run a python script such as `get-data.py` as follows:

```
python get-data.py
```

Run Jupyter notebooks such as `arts-council.ipynb` as follows:

```sh
jupyter execute arts-council.ipynb
```

Some of the pipelines have been configured as [DVC](https://dvc.org) pipelines.
An example of this is the Culture sector dataset. These can be run with the
following command:

```sh
dvc repro pipelines/culture-sector/dvc.yaml
```

### IDE integration

It is possible to integrate Jupyter notebook execution with IDEs such as Visual
Studio Code. Configuration of this integration is beyond the scope of this
guide.
