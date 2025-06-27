import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from soldera.models import Auction, AuctionResults
from datetime import datetime


class Command(BaseCommand):
    help = "Imports auction data from a JSON file into Django models"

    def add_arguments(self, parser):
        parser.add_argument('filename', type=str, help='Path to the JSON file containing auction data')

    def handle(self, *args, **options):
        filename = options['filename']

        try:
            with open(filename, 'r') as file:
                data = json.load(file)
        except FileNotFoundError:
            raise CommandError(f'File {filename} does not exist')
        except json.JSONDecodeError:
            raise CommandError(f'File {filename} is not a valid JSON file')

        # Wrap the entire import in a transaction
        with transaction.atomic():
            try:
                for entry in data["results"]:
                    if AuctionResults.objects.filter(md5_hash=entry['md5_hash']).exists():
                        # Skip, we already have this entry.
                        continue

                    # First, create the AuctionResults instance
                    auction_results = AuctionResults.objects.create(
                        date=datetime.strptime(entry['date'], '%Y-%m-%d').date(),
                        number_of_participants=entry['number_of_participants'],
                        md5_hash=entry['md5_hash']
                    )

                    # Then create all associated Auction instances
                    for auction_data in entry.get('auctions', []):
                        Auction.objects.create(
                            region=auction_data['region'],
                            technology=auction_data['technology'],
                            volume_auctioned=auction_data['volume_auctioned'],
                            average_price=auction_data['average_price'],
                            volume_sold=auction_data['volume_sold'],
                            number_of_winners=auction_data['number_of_winners'],
                            auction_results=auction_results
                        )

                self.stdout.write(
                    self.style.SUCCESS('Successfully imported auction data from JSON')
                )

            except KeyError as e:
                raise CommandError(f'Invalid data structure in JSON file: missing key {e}')
            except ValueError as e:
                raise CommandError(f'Invalid data in JSON file: {e}')
