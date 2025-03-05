## Overview

Data is downloaded from the first Excel spreadsheet hosted on [{{ metadata.sources[0].title }}]({{ metadata.sources[0].url }}). This is converted to a CSV file for further processing.

The following processing takes place:

* data is filtered by Local Authorities within the North East Combined Authority
* the local authority name is expanded to include the code
* some fields are renamed
* the figures are aggregated based on Recipient, Type of funding (NPO or IPSO), Local Authority Code and the Organisations Main Discipline. For each aggregation, the number of awards (count) and the total funding is calculated
* this is further aggregated by Local Authority Code to provide total figures for each Local Authority in the Combined Authority, and average funding per award is calculated per Local Authority

The data presented on the page further limits the funding solely to organisations based in Newcastle.