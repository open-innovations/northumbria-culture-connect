import logging
import re
from pathlib import Path
from urllib.parse import urlparse, urlunparse, urlencode

import petl as etl
import pipeline_utils.organisations.ace as ace
from pipeline_utils.datestamp import save_datestamp
from pipeline_utils.filesystem.paths import SITE
import requests

logging.basicConfig(level=logging.INFO)


RAW_DATA = (Path(__file__).parent / '../raw').resolve()
logging.info('Downloading to %s', RAW_DATA)

def download_to_file(url, local_file, force=False):
    if not Path(local_file).exists() or force:
        logging.info(
            'Downloading %s to %s', url, local_file)
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(local_file, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
    else:
        logging.info("%s already exists", local_file)


def main():
    RAW_DATA.mkdir(exist_ok=True, parents=True)
    arts_council_project_grants()
    arts_council_investment_programme()
    companies_house_company_lists()
    charity_commission_lists()
    download_360_giving()
    onspd()


def arts_council_project_grants():
    logging.info(
        'Downloading Arts Council England National Lottery Project Grants data')
    # Scrape the project page for sources
    sources = ace.get_sources(
        'https://www.artscouncil.org.uk/ProjectGrants/project-grants-data', href=re.compile(r'^/media'))

    # Define function to load the data tables
    def load_grants(url):
        d = etl.fromxlsx(
            ace.url_source(url),
            sheet=1,
            min_row=3
        )
        return d

    # Get all the data sources and store in raw data director
    etl.cat(*(load_grants(s) for s in sources)
            ).tocsv(RAW_DATA / 'arts-council-project-grants.csv')

    save_datestamp(SITE / 'data/arts-council/project-grants/_data/downloaded.yml')


def arts_council_investment_programme():
    logging.info('Downloading Arts Council England Investment Programme data')
    sources = ace.get_sources(
        'https://www.artscouncil.org.uk/how-we-invest-public-money/2023-26-Investment-Programme/2023-26-investment-programme-data', href=re.compile(r'^/media'))

    def load_data(url):
        d = etl.fromxlsx(
            ace.url_source(url),
            sheet=0,
            min_row=0
        )
        return d

    etl.cat(*(load_data(u) for u in sources[0:1])).tocsv(
        RAW_DATA / 'arts-council-investment-programme.csv')

    save_datestamp(SITE / 'data/arts-council/investment-programme/_data/downloaded.yml')



def companies_house_company_lists():
    url = 'https://download.companieshouse.gov.uk/BasicCompanyDataAsOneFile-2024-09-01.zip'
    download_to_file(url, RAW_DATA / 'company-data.zip')


def charity_commission_lists():
    download_to_file('https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt/publicextract.charity.zip', RAW_DATA / 'charity-data.zip')
    download_to_file('https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt/publicextract.charity_area_of_operation.zip', RAW_DATA / 'charity-area-data.zip')
    download_to_file('https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt/publicextract.charity_classification.zip', RAW_DATA / 'charity-classification-data.zip')


def download_360_giving():
    logging.info('Downloading 360 Giving data')

    params = {
        'min_date': '01/2020',
        'recipientTSGType': 'Organisation',
        'recipientOrgRegionName': 'North East',
        'recipientOrgCountyName': 'Newcastle upon Tyne',
        'sort': 'awardDate asc',
    }

    url = 'https://grantnav.threesixtygiving.org/search.csv?' + urlencode(params)
    logging.debug(' REQUEST: %s', url)

    download_to_file(url, RAW_DATA / '360-giving.csv', force=True)
    save_datestamp(SITE / 'data/360-giving/_data/metadata/downloaded.yml')

def onspd():
    download_to_file(
        'https://www.arcgis.com/sharing/rest/content/items/6fb8941d58e54d949f521c92dfb92f2a/data',
        RAW_DATA / 'onspd.zip'
    )


if __name__ == "__main__":
    main()
