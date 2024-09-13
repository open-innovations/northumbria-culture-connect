import re
from urllib.parse import urlparse, urlunparse
import logging
from pathlib import Path

import petl as etl
import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)

request_headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

RAW_DATA = (Path(__file__).parent / '../raw').resolve()
logging.info('Downloading to %s', RAW_DATA)


def main():
    RAW_DATA.mkdir(exist_ok=True, parents=True)
    arts_council_project_grants()


def arts_council_project_grants():
    logging.info('Downloading Arts Council England National Lottery Project Grants data')
    # Scrape the project page for sources
    with requests.get('https://www.artscouncil.org.uk/ProjectGrants/project-grants-data', headers=request_headers) as r:
        soup = BeautifulSoup(r.text, 'html.parser')
    sources = [f"https://www.artscouncil.org.uk/{a['href']}" for a in soup.find_all('a', href=re.compile(r'^/media'))]

    # Define function to load the data tables
    def load_grants(url):
        d = etl.fromxlsx(
            etl.RemoteSource(url, client_kwargs={ 'headers': request_headers }),
            sheet=1,
            min_row=3
        )
        return d

    # Get all the data sources and store in raw data director
    etl.cat(*( load_grants(s) for s in sources )).tocsv(RAW_DATA / 'arts-council-project-grants.csv')


if __name__ == "__main__":
    main()