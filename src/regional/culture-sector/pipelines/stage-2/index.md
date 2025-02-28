This stage attempts to cleanse the data, match to other sources of data and tag with categories (such as Individuals).


```python
import pandas as pd
from thefuzz.process import extractOne, extractBests

import pipeline_utils.db as database

from config import RAW, WORKING, FUNDED_ORGS_LIST
```

## Make direct matches to the company data

First, lets load the company data database.


```python
db = database.connect(read_only=True)
```

Then we'll load our raw longlist into a temporary table.


```python
db.sql(f'''CREATE TEMP TABLE tFundedOrgs AS SELECT DISTINCT organisation FROM read_csv('{FUNDED_ORGS_LIST}');''')
```


```python
db.sql('''SELECT COUNT(*) AS Count FROM tFundedOrgs''')
```




    ┌───────┐
    │ Count │
    │ int64 │
    ├───────┤
    │   511 │
    └───────┘



We'll create a table of direct matches


```python
db.sql('''
       CREATE TEMP TABLE tDirect as SELECT r.*,
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
              "Accounts.AccountCategory" as accounts_category
              -- , c.*
                        
       FROM tFundedOrgs r LEFT JOIN CompanyData c
       ON upper(r.organisation) == c.CompanyName;
''')
```


```python
ignored_companies = [
    'Paul Miller'
]
```


```python
direct_matches = db.sql(
    'SELECT * from tDirect WHERE company_number IS NOT NULL'
).df().query('~organisation.isin(@ignored_companies)')
```


```python
db.close()
```


```python
direct_matches.sort_values(by='organisation').loc[: , ['organisation', 'company_number']].to_csv(WORKING / '2-company-match-direct.csv', index=False)
```

## Fix typos in longlist

Having matched the details, let's see if we can fuzzy match missing items in the longlist.

First, let's get a list of organisations that have been matched to Company House data.


```python
matched_organisations = direct_matches.organisation.unique().tolist()
```

Then load the raw longlist


```python
raw = pd.read_csv(FUNDED_ORGS_LIST)
```


```python
corrections = pd.concat(
    [
        raw,
        raw.organisation.map(
            lambda x: extractOne(x, matched_organisations, score_cutoff=90)
        ).apply(
            pd.Series, index=['match', 'score']
        )
    ], axis=1
).query(
    'score.notna() and score < 100'
).loc[: ,['organisation', 'match']].set_index('organisation')
corrections
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>match</th>
    </tr>
    <tr>
      <th>organisation</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Monkfish Productions CIC</th>
      <td>Monkfish Productions CIO</td>
    </tr>
    <tr>
      <th>Moving Parts Arts</th>
      <td>Moving Parts Arts CIO</td>
    </tr>
    <tr>
      <th>tiny dragon Productins</th>
      <td>tiny dragon Productions</td>
    </tr>
  </tbody>
</table>
</div>




```python
corrections.to_csv(WORKING / '2-company-corrections.csv')
```

## Fuzzy match company data


```python
drop_list = pd.concat([direct_matches, corrections.reset_index()]).organisation
```


```python
db = database.connect(read_only=True)
```


```python
companies = db.query('''
                        SELECT DISTINCT CompanyName, CompanyNumber FROM CompanyData
                        WHERE CompanyStatus == 'Active'
                        AND "RegAddress.PostCode" SIMILAR TO '(NE|DH|SR).*'
                        ORDER BY CompanyName;
''').df()
```


```python
db.close()
```


```python
candidates = pd.read_csv(FUNDED_ORGS_LIST, usecols=[0]).organisation
```


```python
def matcher(c, choices):
    return extractBests(c, choices, score_cutoff=80)
```


```python
candidate_list = candidates[~candidates.isin(drop_list)].unique().tolist()
```


```python
matches = companies.CompanyName.str.replace(r'\W+', ' ', regex=True).apply(matcher, choices=candidate_list).rename('Matches')
```


```python
res = pd.concat([companies, matches], axis=1).explode('Matches').dropna()
res['match'], res['score'] = zip(*res.Matches)

fuzzy_matches = res.loc[res.score > 90, ['match', 'CompanyName', 'CompanyNumber', 'score']]
fuzzy_matches['type'] = 'fuzzy'
fuzzy_matches.set_index('match').to_csv(WORKING / '2-company-match-fuzzy.csv')
```

Direct match charities


```python
db = database.connect(read_only=True)
```


```python
db.query(f'''
         CREATE OR REPLACE TEMP TABLE tShortlist AS SELECT organisation FROM '{ FUNDED_ORGS_LIST }';
         ''')
```


```python
charities = db.query('''
         SELECT DISTINCT
            s.*,
            c.charity_name,
            c.registered_charity_number,
            c.charity_company_registration_number
         FROM Charities c
         JOIN tShortlist s
         ON upper(s.organisation) == upper(c.charity_name)
         ORDER BY charity_name
         ''').df(
         )
charities.to_csv(WORKING / '2-charity-match-direct.csv')
```


```python
db.close()
```

## SIC Codes


```python
db = database.connect(read_only=True)
```

Get all matched company numbers and store in a temp table.


```python
db.query(
    f'''
    CREATE OR REPLACE TEMP TABLE tCompanyNumbers AS
    SELECT *
    FROM
    (
        SELECT company_number FROM read_csv('{ WORKING / '2-company-match-direct.csv' }')
        UNION ALL
        SELECT CompanyNumber AS company_number FROM read_csv('{ WORKING / '2-company-match-fuzzy.csv' }')
        UNION ALL
        SELECT charity_company_registration_number AS company_number FROM read_csv('{ WORKING / '2-charity-match-direct.csv' }')
    )
    '''
)
```


```python
all_sic_codes = db.query(
    '''
    SELECT
        [x for x in [
            "SICCode.SicText_1",
            "SICCode.SicText_2",
            "SICCode.SicText_3",
            "SICCode.SicText_4"
        ] if x is not NULL] as sic_code
    FROM CompanyData c
    JOIN tCompanyNumbers n
    ON c.CompanyNumber == n.company_number
    '''
)
```


```python
excluded_sic_codes = [
    'None Supplied',
    '47610 - Retail sale of books in specialised stores',
    '47990 - Other retail sale not in stores, stalls or markets',
    '56302 - Public houses and bars',
    '70210 - Public relations and communications activities',
    '82990 - Other business support service activities n.e.c.',
    '84110 - General public administration activities',
    '85590 - Other education n.e.c.',
    '85600 - Educational support services',
    '87900 - Other residential care activities n.e.c.',
    '88100 - Social work activities without accommodation for the elderly and disabled',
    '88990 - Other social work activities without accommodation n.e.c.',
    '93120 - Activities of sport clubs',
    '93290 - Other amusement and recreation activities n.e.c.',
    '94110 - Activities of business and employers membership organizations',
    '94990 - Activities of other membership organizations n.e.c.',
    '96090 - Other service activities n.e.c.',
]
```


```python
pd.Series(
    all_sic_codes.df().sic_code.explode().unique(),
    name='sic_code'
).sort_values().pipe(
    lambda s: s.loc[~s.isin(excluded_sic_codes)]
).to_csv(
    WORKING / '2-sic-codes.csv', index=False
)
```

## Identify possible individuals
