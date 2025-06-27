import calendar
import datetime
from pathlib import Path
import hashlib
from typing import Tuple

import requests
from bs4 import BeautifulSoup
import pandas as pd
from django.conf import settings

from soldera.types import ENERGY_TECHNOLOGY_MAPPING
from soldera.models import AuctionResults, Auction

BASE_URL = "https://www.eex.com"
RESULTS_URL = f"{BASE_URL}/en/markets/energy-certificates/french-auctions-power"
TEMP_XLSX_PATH = Path(settings.BASE_DIR) / "temp" / "results.xlsx"


class ScraperException(Exception):
    """Base exception for scraper-related errors."""

    pass


def _get_results_xlsx_link(results_relative_link: str) -> str:
    """Constructs the full URL for the results XLSX file."""
    return f"{BASE_URL}/{results_relative_link}"


def _md5_hash_from_bytes(content: bytes) -> str:
    """Generates MD5 hash from bytes."""
    return hashlib.md5(content).hexdigest()


def _parse_filename_date(filename: str) -> Tuple[int, int]:
    """
    Extracts month and year from filename.

    Args:
        filename: String in format containing month_year

    Returns:
        Tuple of (year, month)

    Raises:
        ScraperException: If date parsing fails
    """
    try:
        parts = filename.split("_")
        month = calendar.Month[parts[1].upper()].value
        year = int(parts[2])
        return year, month
    except (KeyError, ValueError, IndexError) as e:
        raise ScraperException(f"Failed to parse date from filename: {filename}") from e


def _process_results_file(contents: bytes, date: datetime.date) -> None:
    """
    Process the 'latest results' file and store data in a database.

    Args:
        contents: Raw bytes of xlsx file
        date: Date of the auction results
    """
    md5_hash = _md5_hash_from_bytes(contents)

    if AuctionResults.objects.filter(md5_hash=md5_hash).exists():
        return

    # Ensure temp directory exists
    TEMP_XLSX_PATH.parent.mkdir(exist_ok=True)

    # Save and process .xlsx (excel) file
    with open(TEMP_XLSX_PATH, "wb") as f:
        f.write(contents)

    try:
        # Read participants data
        participants_df = pd.read_excel(TEMP_XLSX_PATH, skiprows=[0, 1], nrows=1)
        participants_count = participants_df.columns[1]

        # Create an auction results record
        auction_results = AuctionResults.objects.create(
            date=date, number_of_participants=participants_count, md5_hash=md5_hash
        )

        # Process volume data
        volume_data_df = pd.read_excel(TEMP_XLSX_PATH, skiprows=[0, 1, 2, 3])
        volume_data_df = volume_data_df.rename(
            columns={
                "RÃ©gion / Region": "region",
                "Technologie / Technology": "technology",
                "Total Volume Auctionned": "volume_auctioned",
                "Total Volume Sold": "volume_sold",
                "Weighted Average Price (â‚¬ / MWh)": "average_price",
                "Number of winners per couple region/technology": "number_of_winners",
            }
        )
        volume_data_df = volume_data_df.drop(
            columns=["My Total Volume", "My Weighted Average Price (â‚¬ / MWh)"]
        )

        # Create auction records
        auctions = [
            Auction(
                # HACK: There must be a nicer way to solve this
                region=row.get("region", "Unknown").encode(encoding="Windows-1252").decode(),
                volume_auctioned=row.get("volume_auctioned", 0),
                volume_sold=row.get("volume_sold", 0),
                average_price=row.get("average_price", 0),
                number_of_winners=row.get("number_of_winners", 0),
                technology=ENERGY_TECHNOLOGY_MAPPING.get(
                    row.get("technology", "Unknown"), row.get("technology", "Unknown")
                ),
                auction_results=auction_results,
            )
            for _, row in volume_data_df.iterrows()
        ]
        Auction.objects.bulk_create(auctions)

    finally:
        # Clean up the temporary file
        TEMP_XLSX_PATH.unlink(missing_ok=True)


def run_discovery() -> None:
    """
    Main function to discover and process auction results.

    Raises:
        ScraperException: If scraping or processing fails
    """
    try:
        response = requests.get(RESULTS_URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the "latest results" link
        link_element = soup.find("a", title="Download the latest results")
        if not link_element or not (results_relative_link := link_element.get("href")):
            raise ScraperException("No results link found")

        # Parse date from filename
        file_name = results_relative_link.rsplit("/", maxsplit=1)[-1]
        year, month = _parse_filename_date(file_name)

        # Download and process the latest results file
        results_link = _get_results_xlsx_link(results_relative_link)
        response = requests.get(results_link)
        response.raise_for_status()

        # Unfortunately, there is no information about the auction date.
        date = datetime.date(year=year, month=month, day=1)
        _process_results_file(response.content, date)

    except requests.RequestException as e:
        raise ScraperException(f"Failed to fetch data: {str(e)}") from e
