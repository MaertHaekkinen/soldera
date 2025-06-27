from django_tasks import task

from soldera import scraper


@task()
def discover_auctions() -> None:
    scraper.run_discovery()
