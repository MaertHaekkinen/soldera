from django_tasks.backends.database.models import DBTaskResult as Task
from rest_framework import serializers

from soldera.models import Auction, AuctionResults


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id",
            "status",
            "started_at",
            "enqueued_at",
            "finished_at",
            "traceback",
            "exception_class_path",
        ]


class AuctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = "__all__"


class AuctionResultsSerializer(serializers.ModelSerializer):
    # date = serializers.DateField(format="%Y-%m")
    auctions = AuctionSerializer(many=True)

    class Meta:
        model = AuctionResults
        fields = "__all__"
