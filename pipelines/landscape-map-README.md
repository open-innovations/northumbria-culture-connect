# Landscape Map

This is an experiment to build a view of the cultural organisations operating in
the North East.

Creating the dataset involves the following steps:

## Collect data

In this stage, we collect a list of organisations (and individuals) in receipt of funding funding from one of the funding streams.

At present these streams are:

* Arts Council England Investment Programme (NPO and ISPO)
* Arts Council England National Lottery Project Grants

The idea is that this will extend to other sources of funding.

Some of these will be organisations, and some will be individual creatives.
It may be desirable to remove of individuals from the dataset, so some means
to categorise the lines will be required.

Data at this stage has quality issues, such as

* differently spelled organisation names in different lines
  (e.g. both **tiny dragon Productions** and **tiny dragon Productins**
  appear in the list)
* mis-attributed local authority (e.g. same organisation name mapped
  to Gateshead and Newcastle)

There may be a way of correcting some common spellings automatically,
although some are more tricky to fix without manual intervention
(e.g. which is correct between **Monkfish Productions CIC** and
**Monkfish Productions CIO**?).

There is also no data about location, which is needed to place on a
geographic map.

To achieve this without significant manual intervention requires a
reference set.

## Build reference table

It is likely that the reference data will come from a number of sources.
At this stage, we are using Companies House bulk data as a source of
registered companies.

Benefits of using Companies House data include:

1. Ability to match to registered company names to remove issues with
   mistyped organisation names
2. Potential to map to a postcode for an organisation (with the caveat
   that this might be the postcode of the accountants).
3. Ability to harvest **SIC codes** for known cultural organisations
   to identify organisations working the sector who do not appear
   in the funding streams being used.

TKTKTK The process for building the organisation reference table

## Create the combined list


