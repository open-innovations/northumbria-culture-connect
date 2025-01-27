# Culture Landscape Pipelines

This is an experiment to build a view of the cultural organisations operating in
the North East.

## Stages

Creating the dataset involves the following stages.

### Stage 1

The purpose of this stage is to build a longlist of funded organisations.

We collect a list of organisations (and individuals) in receipt of funding
funding from at least one funding stream. While the streams at the moment are
from Arts Council England, ultimately this should extend to other sources of
funding.

At present the input data streams are:

- Arts Council England Investment Programme (NPO and ISPO)
- Arts Council England National Lottery Project Grants

The resulting list data is stored in
`raw/culture-landscape/funded-organisations.csv`

Some of these will be organisations, and some will be individual creatives. It
may be desirable to remove of individuals from the dataset, so some means to
categorise the lines will be required.

Data at this stage has quality issues, such as

- differently spelled organisation names in different lines (e.g. both **tiny
  dragon Productions** and **tiny dragon Productins** appear in the list)
- mis-attributed local authority (e.g. same organisation name mapped to
  Gateshead and Newcastle)

There may be a way of correcting some common spellings automatically, although
some are more tricky to fix without manual intervention (e.g. which is correct
between **Monkfish Productions CIC** and **Monkfish Productions CIO**?).

There is also no data about location, which is needed to place on a geographic
map.

To achieve this without significant manual intervention requires a reference
set.

### Stage 2

During stage 2, the list of funded organisations is matched against both
companies house data and the data from the charity commission.

The matching algorithm is as follows:

1. Attempt a direct match of company name against the reference set
2. Using this list, determine spelling mistakes in the list of funded
   organisations to enable corrections. This is done by fuzzy matching the list
   of raw organisations onto itself, excluding any direct matches.
3. Attempt a full fuzzy match of the corrected list of unmatched entries with
   the reference list.

This is currently only implemented in full for Companies House data. 
