from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter

from soldera import views
from soldera.api import AuctionResultsViewSet, TaskViewSet
from core import views as core_views

router = DefaultRouter(trailing_slash=False)
router.register(r"tasks", TaskViewSet, basename="tasks")

router.register(r"auction-results", AuctionResultsViewSet, basename="auction-results")

app_name = "soldera"
urlpatterns = [
    path("healthcheck", views.healthcheck, name="healthcheck"),
    path("admin", admin.site.urls),
    path("api/", include(router.urls)),
    path("<path:_path>", core_views.react_index, name="react"),
    path("*", core_views.react_index, name="react"),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
