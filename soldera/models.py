from django.db import models


class AuctionResults(models.Model):
    date = models.DateField()
    number_of_participants = models.IntegerField()
    md5_hash = models.CharField(max_length=32, unique=True)

    class Meta:
        ordering = ["-date", "-id"]


class Auction(models.Model):
    region = models.CharField()
    technology = models.CharField()
    volume_auctioned = models.IntegerField()
    average_price = models.FloatField()
    volume_sold = models.IntegerField()
    number_of_winners = models.IntegerField()
    auction_results = models.ForeignKey(
        AuctionResults, on_delete=models.CASCADE, related_name="auctions"
    )

    class Meta:
        ordering = ["region", "technology", "-id"]
