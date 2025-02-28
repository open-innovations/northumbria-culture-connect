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
         CREATE OR REPLACE TEMP TABLE tSicCodes AS
              SELECT *
              FROM read_csv('{ WORKING / '2-sic-codes.csv' }');
         CREATE OR REPLACE TEMP TABLE tPostcodes AS
              SELECT pcds AS postcode, lat, long
              FROM read_csv('{ DATA / 'reference/onspd_extract.csv' }')
              WHERE oslaua == 'E08000021';
         CREATE OR REPLACE TEMP TABLE tCompanyExtract AS
              SELECT
                    CompanyName as registered_name,
                    CompanyNumber as company_number,
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
                    "Accounts.AccountCategory" as accounts_category,
                    lat AS latitude, long as longitude,
              FROM CompanyData c
              JOIN tPostcodes p
              ON c."RegAddress.PostCode" == p.postcode;
              ;
         ''')

```


```python
db.query('''
    SELECT * from tCompanies;
         ''')
```




    ┌─────────────────────────────────────┬────────────────┬─────────┬───────┐
    │            organisation             │ company_number │  type   │ score │
    │               varchar               │    varchar     │ varchar │ int64 │
    ├─────────────────────────────────────┼────────────────┼─────────┼───────┤
    │ Allenheads Contemporary Arts        │ 06764121       │ fuzzy   │    95 │
    │ Amber Film & Photography Collective │ 07218282       │ fuzzy   │    95 │
    │ a-n The Artists Information Company │ 01626331       │ fuzzy   │    92 │
    │ Bloodaxe Books Ltd                  │ 15402049       │ fuzzy   │    95 │
    │ Changing Relations                  │ 08715299       │ fuzzy   │    95 │
    │ Cloud Nine Theatre Productions      │ 04095014       │ fuzzy   │    95 │
    │ Eliot Smith Company                 │ 09442391       │ fuzzy   │    95 │
    │ Equal Arts                          │ 01992359       │ fuzzy   │    95 │
    │ Generator North East                │ 03670235       │ fuzzy   │    95 │
    │ Hexham Book Festival                │ 06630555       │ fuzzy   │    95 │
    │          ·                          │    ·           │   ·     │     · │
    │          ·                          │    ·           │   ·     │     · │
    │          ·                          │    ·           │   ·     │     · │
    │ The Witham Hall Ltd                 │ 06959661       │ direct  │   100 │
    │ Theatre Space North East CIC        │ 10059355       │ direct  │   100 │
    │ Tyneside Cinema                     │ 01113101       │ direct  │   100 │
    │ Unfolding Theatre                   │ 06764666       │ direct  │   100 │
    │ Unlock Music CIC                    │ 13277858       │ direct  │   100 │
    │ Vane Contemporary Art Limited       │ 04313545       │ direct  │   100 │
    │ Woodhorn Charitable Trust           │ 06893854       │ direct  │   100 │
    │ Workie Ticket Theatre CIC           │ 11780194       │ direct  │   100 │
    │ YMCA North Tyneside                 │ 02703063       │ direct  │   100 │
    │ tiny dragon Productions             │ 13816200       │ direct  │   100 │
    ├─────────────────────────────────────┴────────────────┴─────────┴───────┤
    │ 126 rows (20 shown)                                          4 columns │
    └────────────────────────────────────────────────────────────────────────┘




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
company_by_sic = etl.fromdataframe(
    db.query(f'''
             SELECT DISTINCT c.*
             FROM (
               SELECT e.*
               FROM tCompanyExtract e
               LEFT JOIN (SELECT company_number FROM tCompanies) r
               ON e.company_number == r.company_number
               WHERE r.company_number IS NULL
             ) c
             JOIN tSicCodes s
             ON list_contains(c.sic_code, s.sic_code)
             ORDER BY c.company_number;
             ''').df()
)
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
landscape_matched = (
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
)

landscape = (
    etl
    .cat(landscape_matched, company_by_sic)
    .convert('postcode', lambda x: postcode_lookup.get(x, { 'pcds': x }))
    .unpackdict('postcode', keys=['pcds', 'lat', 'long', 'oslaua'])
    .convert('latitude', lambda x, r: r['lat'], pass_row=True, where=lambda r: r['latitude'] == None and r['lat'] != None)
    .convert('longitude', lambda x, r: r['long'], pass_row=True, where=lambda r: r['longitude'] == None and r['long'] != None)
    .cutout('lat', 'long')
    .convert('organisation', lambda x, r: x or r.registered_name, pass_row=True)
    .cutout('registered_name')
    .convert('sic_code', list)
    .sort('organisation')
)
```


```python
landscape.selectnotnone('company_number').duplicates('company_number')
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
<td>Equal Arts</td>
<td>E08000021</td>
<td>Newcastle upon Tyne</td>
<td>None</td>
<td>None</td>
<td>True</td>
<td>54.974992</td>
<td>-1.610437</td>
<td>PRI/LTD BY GUAR/NSC (Private, limited by guarantee, no share capital)</td>
<td>TOTAL EXEMPTION FULL</td>
<td>01992359</td>
<td>Active</td>
<td>None</td>
<td>1986-02-21 00:00:00</td>
<td>NEWCASTLE UPON TYNE</td>
<td>['90040 - Operation of arts facilities']</td>
<td>http://business.data.gov.uk/id/company/01992359</td>
<td>fuzzy</td>
<td style='text-align: right'>95</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>NE1 8AX</td>
<td>E08000021</td>
</tr>
<tr>
<td>Equal Arts</td>
<td>E08000037</td>
<td>Gateshead</td>
<td>None</td>
<td>None</td>
<td>True</td>
<td>54.974992</td>
<td>-1.610437</td>
<td>PRI/LTD BY GUAR/NSC (Private, limited by guarantee, no share capital)</td>
<td>TOTAL EXEMPTION FULL</td>
<td>01992359</td>
<td>Active</td>
<td>None</td>
<td>1986-02-21 00:00:00</td>
<td>NEWCASTLE UPON TYNE</td>
<td>['90040 - Operation of arts facilities']</td>
<td>http://business.data.gov.uk/id/company/01992359</td>
<td>fuzzy</td>
<td style='text-align: right'>95</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>NE1 8AX</td>
<td>E08000021</td>
</tr>
<tr>
<td>International Guitar Foundation & Festivals</td>
<td>E08000021</td>
<td>Newcastle upon Tyne</td>
<td>None</td>
<td>None</td>
<td>True</td>
<td>None</td>
<td>None</td>
<td>PRI/LTD BY GUAR/NSC (Private, limited by guarantee, no share capital)</td>
<td>MICRO ENTITY</td>
<td>02932317</td>
<td>Active</td>
<td>None</td>
<td>1994-05-24 00:00:00</td>
<td>LONDON</td>
<td>['90030 - Artistic creation']</td>
<td>http://business.data.gov.uk/id/company/02932317</td>
<td>direct</td>
<td style='text-align: right'>100</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>N1 9AG</td>
<td>None</td>
</tr>
<tr>
<td>International Guitar Foundation & Festivals</td>
<td>E08000022</td>
<td>North Tyneside</td>
<td>None</td>
<td>None</td>
<td>True</td>
<td>None</td>
<td>None</td>
<td>PRI/LTD BY GUAR/NSC (Private, limited by guarantee, no share capital)</td>
<td>MICRO ENTITY</td>
<td>02932317</td>
<td>Active</td>
<td>None</td>
<td>1994-05-24 00:00:00</td>
<td>LONDON</td>
<td>['90030 - Artistic creation']</td>
<td>http://business.data.gov.uk/id/company/02932317</td>
<td>direct</td>
<td style='text-align: right'>100</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>N1 9AG</td>
<td>None</td>
</tr>
<tr>
<td>Vane Contemporary Art Limited</td>
<td>E08000021</td>
<td>Newcastle upon Tyne</td>
<td>None</td>
<td>None</td>
<td>True</td>
<td>54.965252</td>
<td>-1.602409</td>
<td>PRI/LTD BY GUAR/NSC (Private, limited by guarantee, no share capital)</td>
<td>MICRO ENTITY</td>
<td>04313545</td>
<td>Active</td>
<td>None</td>
<td>2001-10-30 00:00:00</td>
<td>GATESHEAD</td>
<td>['90040 - Operation of arts facilities']</td>
<td>http://business.data.gov.uk/id/company/04313545</td>
<td>direct</td>
<td style='text-align: right'>100</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>None</td>
<td>NE8 2AP</td>
<td>E08000037</td>
</tr>
</tbody>
</table>
<p><strong>...</strong></p>




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


```python
landscape.cut('sic_code').selectnotnone('sic_code')
```




<table class='petl'>
<thead>
<tr>
<th>sic_code</th>
</tr>
</thead>
<tbody>
<tr>
<td>['90030 - Artistic creation']</td>
</tr>
<tr>
<td>['70229 - Management consultancy activities other than financial management', '90020 - Support activities to performing arts']</td>
</tr>
<tr>
<td>['90020 - Support activities to performing arts']</td>
</tr>
<tr>
<td>['59111 - Motion picture production activities', '59112 - Video production activities', '74909 - Other professional, scientific and technical activities n.e.c.']</td>
</tr>
<tr>
<td>['58110 - Book publishing']</td>
</tr>
</tbody>
</table>
<p><strong>...</strong></p>




```python

```
