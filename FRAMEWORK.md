# Development framework

Lume is a general purpose toolkit for building websites.
This document contains some of the mechanisms that have been defined to build the NCC Data Observatory.

## Page metadata

Set the following page data to render the Metadata block. All of these are optional.

```yml
metadata:
    downloaded: timestamp of most recent download
    processed: timestamp of most recent pipeline run
    sources:
        - url: URL of data source
          title: Title of source page
        - url: URL of second data source
          title: Title of second data source
    pipelines:
        - /url/of/local/pipeline/file/
```