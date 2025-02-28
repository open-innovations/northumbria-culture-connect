## Data pipeline description

Preparing this data requires a series of steps:

1. Identity a longlist of companies from funding data.
2. Attempt to match these to bulk data from Companies House.
   This comprises several steps, 
    * Direct matches
    * Excluding any false positives
    * Fuzzy matching to deal with typographical errors in company name
    * Further fuzzy matching to deal with other slight differences in company name
3. Taking the shortlist of significant SIC Codes of the matched companies and selecting
   other companies that have selected these codes.