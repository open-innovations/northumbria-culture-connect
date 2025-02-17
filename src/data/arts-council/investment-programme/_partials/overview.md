## Overview

Data is downloaded from the first Excel spreadsheet hosted on [{{ metadata.sources[0].title }}]({{ metadata.sources[0].url }}). This is converted to a CSV file for further processing.

The following processing takes place:

* Data is filtered by Local Authorities within the North East Combined Authority.
* The local authority name is expanded to include the code.
* Some fields are renamed.
* The figures are aggregated based on Recipient, Type of funding (NPO or IPSO), Local Authority Code and the Organisations Main Discipline. For each aggregation, the number of awards (count) and the total funding is calculated.
* This is further aggregated by Local Authority Code to provide total figures for each Local Authority in the Combined Authority, and average funding per award is calculated per Local Authority.

The data presented on the page further limits the funding solely to organisations based in Newcastle.