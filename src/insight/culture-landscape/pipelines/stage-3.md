# Landscape map - stage 3

This stage merges the raw longlist with the candidate data from the reference sources to create the new list.

It round-trips the data from the existing landscape list to ensure that any manual overrides are included.


```python
import duckdb
import petl as etl
from pipeline_utils.reference.geo import la_code_lookup
from pipeline_utils.reference.onspd import normalise_postcode, postcode_lookup
from pipeline_utils.filesystem.paths import RAW_DATA, DATA
from config import WORKING
```

Load the spelling corrections we have inferred from the matching stage.


```python
corrections = etl.fromcsv(WORKING / '2-company-corrections.csv').lookupone('organisation', 'match')
```

Load the untagged longlist from the raw directory and perform the following operations:

1. Convert numeric data to numbers
2. Correct the spellings of the organisational data
3. Augment with local authority data


```python
raw = etl.fromcsv(
    WORKING / 'funded-organisations.csv'
).convertnumbers(
).convert(
    'organisation', lambda x: corrections.get(x, x)
).convert(
    'Local authority', la_code_lookup
).unpackdict(
    'Local authority'
).rename({
    'LAD24CD': 'funding_geo_code',
    'LAD24NM': 'funding_geo_name',
}).cache()

raw
```




<table class='petl'>
<thead>
<tr>
<th>organisation</th>
<th>Source</th>
<th>Number</th>
<th>funding_geo_code</th>
<th>funding_geo_name</th>
</tr>
</thead>
<tbody>
<tr>
<td>4M Puppets</td>
<td>Project Grant</td>
<td style='text-align: right'>1</td>
<td>E08000021</td>
<td>Newcastle upon Tyne</td>
</tr>
<tr>
<td>Abdulrahman Abu - Zayd</td>
<td>Project Grant</td>
<td style='text-align: right'>1</td>
<td>E08000037</td>
<td>Gateshead</td>
</tr>
<tr>
<td>Action for Children</td>
<td>Project Grant</td>
<td style='text-align: right'>1</td>
<td>E06000057</td>
<td>Northumberland</td>
</tr>
<tr>
<td>Adam Phillips</td>
<td>Project Grant</td>
<td style='text-align: right'>3</td>
<td>E08000037</td>
<td>Gateshead</td>
</tr>
<tr>
<td>Adam Shield</td>
<td>Project Grant</td>
<td style='text-align: right'>1</td>
<td>E08000021</td>
<td>Newcastle upon Tyne</td>
</tr>
</tbody>
</table>
<p><strong>...</strong></p>



Get the list of sources in the longlist. We'll use this to update the values in the columns later on.


```python
sources = tuple(raw.cut('Source').distinct().values('Source'))
sources
```




    ('IPSO', 'NPO', 'Project Grant')



Recast the longlist to convert the Source column into a column per entry, and convert any non-None values into True


```python
wide_table = raw.recast(
    variablefield="Source",
    valuefield="Number"
).convert(
    sources,
    lambda x: True if x is not None else None
)
wide_table
```




<table class='petl'>
<thead>
<tr>
<th>organisation</th>
<th>funding_geo_code</th>
<th>funding_geo_name</th>
<th>IPSO</th>
<th>NPO</th>
<th>Project Grant</th>
</tr>
</thead>
<tbody>
<tr>
<td>4M Puppets</td>
<td>E08000021</td>
<td>Newcastle upon Tyne</td>
<td>None</td>
<td>None</td>
<td>True</td>
</tr>
<tr>
<td>Abdulrahman Abu - Zayd</td>
<td>E08000037</td>
<td>Gateshead</td>
<td>None</td>
<td>None</td>
<td>True</td>
</tr>
<tr>
<td>Action for Children</td>
<td>E06000057</td>
<td>Northumberland</td>
<td>None</td>
<td>None</td>
<td>True</td>
</tr>
<tr>
<td>Adam Phillips</td>
<td>E08000037</td>
<td>Gateshead</td>
<td>None</td>
<td>None</td>
<td>True</td>
</tr>
<tr>
<td>Adam Shield</td>
<td>E08000021</td>
<td>Newcastle upon Tyne</td>
<td>None</td>
<td>None</td>
<td>True</td>
</tr>
</tbody>
</table>
<p><strong>...</strong></p>



At this point we will also add in new data from the result of stage 2.

1. `location` Manually set locations 
2. `companies` Company data from Companies house (direct and fuzzy matched)


```python
location = etl.fromcsv(RAW_DATA / 'landscape-locations.csv').lookupone('organisation', ['latitude', 'longitude'])
```

Direct and fuzzy data is loaded from the database.


```python
db = duckdb.connect(RAW_DATA / 'company-data.db', read_only=True)
db.query(f'''
         CREATE OR REPLACE TEMP TABLE tCompanies AS
              SELECT match as organisation, CompanyNumber as company_number, type, score
                     FROM read_csv('{ WORKING / '2-company-match-fuzzy.csv' }')
              UNION ALL
              SELECT organisation, charity_company_registration_number AS company_number, 'charity' AS type, 100 AS score
                     FROM read_csv('{ WORKING / '2-charity-match-direct.csv' }')
              UNION ALL
              SELECT *, 'direct' AS type, 100 as score
                     FROM read_csv('{ WORKING / '2-company-match-direct.csv' }');
         CREATE OR REPLACE TEMP TABLE tCharities AS
              SELECT *
                     FROM read_csv('{ WORKING / '2-charity-match-direct.csv' }');
         ''')

```


```python
companies = etl.fromdataframe(
    db.query('''
             SELECT m.organisation as organisation,
                c.CompanyName as registered_name,
                c.CompanyNumber as company_number,
                m.type,
                m.score,
                "URI" as uri,
                "RegAddress.PostTown" as post_town,
                "RegAddress.PostCode" as postcode,
                CompanyCategory as company_category,
                CompanyStatus as company_status,
                [x for x in [
                        "SICCode.SicText_1",
                        "SICCode.SicText_2",
                        "SICCode.SicText_3",
                        "SICCode.SicText_4"
                ] if x is not NULL] as sic_code,
                IncorporationDate as incorporation_date,
                DissolutionDate as dissolution_date,
                "Accounts.AccountCategory" as accounts_category
             FROM tCompanies m
             JOIN CompanyData c
             ON m.company_number == c.CompanyNumber;
             ''').df())
```


```python
charities = etl.fromdataframe(
    db.query('''
             SELECT
             l.organisation,
             c.charity_name,
             c.registered_charity_number,
             c.charity_company_registration_number,
             charity_contact_postcode,
             charity_contact_web,
             latest_income AS charity_latest_income,
             latest_expenditure AS charity_latest_expenditure
             FROM Charities c
             JOIN tCharities l
             ON c.registered_charity_number == l.registered_charity_number
             ''').df()
)
```


```python
db.close()
```


```python
company_data = companies.dictlookupone('organisation')
charity_data = charities.dictlookupone('organisation')
```

Create the new landscape table


```python
landscape = (
    wide_table
    .addfield('location', lambda r: location.get(r.organisation, ()))
    .unpack('location', newfields=['latitude', 'longitude'])
    .addfield('company_data', lambda r: company_data.get(r.organisation, {}))
    .unpackdict('company_data', keys=[
        'company_category',
        'accounts_category',
        'company_number',
        'company_status',
        'dissolution_date',
        'incorporation_date',
        'post_town',
        'postcode',
        'sic_code',
        'uri',
        'type', 'score'
    ])
    .convert('postcode', normalise_postcode)
    .addfield('charity_data', lambda r: charity_data.get(r.organisation, {}))
    .unpackdict('charity_data', keys=[
        'charity_name',
        'registered_charity_number',
        'charity_company_registration_number',
        'charity_contact_postcode',
        'charity_contact_web',
        'charity_latest_expenditure',
        'charity_latest_income',
    ])
    .convert('postcode', lambda x: postcode_lookup.get(x, { 'pcds': x }))
    .unpackdict('postcode', keys=['pcds', 'lat', 'long', 'oslaua'])
    .convert('latitude', lambda x, r: r['lat'], pass_row=True, where=lambda r: r['latitude'] == None and r['lat'] != None)
    .convert('longitude', lambda x, r: r['long'], pass_row=True, where=lambda r: r['longitude'] == None and r['long'] != None)
    .cutout('lat', 'long')
    .sort('organisation')
)
```


```python
landscape.selectnotnone('registered_charity_number').select(lambda r: r.company_number != r.charity_company_registration_number)
```




<table class='petl'>
<thead>
<tr>
<th>organisation</th>
<th>funding_geo_code</th>
<th>funding_geo_name</th>
<th>IPSO</th>
<th>NPO</th>
<th>Project Grant</th>
<th>latitude</th>
<th>longitude</th>
<th>company_category</th>
<th>accounts_category</th>
<th>company_number</th>
<th>company_status</th>
<th>dissolution_date</th>
<th>incorporation_date</th>
<th>post_town</th>
<th>sic_code</th>
<th>uri</th>
<th>type</th>
<th>score</th>
<th>charity_name</th>
<th>registered_charity_number</th>
<th>charity_company_registration_number</th>
<th>charity_contact_postcode</th>
<th>charity_contact_web</th>
<th>charity_latest_expenditure</th>
<th>charity_latest_income</th>
<th>pcds</th>
<th>oslaua</th>
</tr>
</thead>
<tbody>
<tr>
<td>Sangini</td>
<td>E08000023</td>
<td>South Tyneside</td>
<td>None</td>
<td>None</td>
<td>True</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>SANGINI</td>
<td style='text-align: right'>1124769</td>
<td>01124769</td>
<td>NE34 0RG</td>
<td>https://sanginiafriend.wordpress.com</td>
<td>43660</td>
<td>86708</td>
<td>None</td>
<td>None</td>
</tr>
</tbody>
</table>




Finally, write the CSV file


```python
landscape.tocsv(DATA / 'culture_landscape.csv')
```
