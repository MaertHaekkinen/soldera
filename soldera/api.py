from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django_tasks.backends.database.models import DBTaskResult as Task
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from soldera.models import AuctionResults
from soldera.serializers import AuctionResultsSerializer, TaskSerializer
from soldera.tasks import discover_auctions


class TaskViewSet(viewsets.ViewSet):
    """
    A simple ViewSet for listing or retrieving Tasks.
    """

    def get_queryset(self) -> QuerySet[Task]:
        return Task.objects.all()

    def list(self, request):
        serializer = TaskSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        task: Task = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = TaskSerializer(task)
        return Response(serializer.data)


class AuctionResultsViewSet(viewsets.ViewSet):
    """
    A simple ViewSet for listing or retrieving Auctions.
    """

    def get_queryset(self) -> QuerySet[AuctionResults]:
        return AuctionResults.objects.prefetch_related(
            "auctions"
        )

    def list(self, request):
        serializer = AuctionResultsSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        auction_results: AuctionResults = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = AuctionResultsSerializer(auction_results)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], permission_classes=[])
    def refresh(self, request):
        task = discover_auctions.enqueue()
        return Response({"id": task.id})
