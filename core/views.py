from django.http import HttpResponse
from rest_framework.request import Request

from core.lib import open_static_file


def react_index(request: Request, _path: str | None = None) -> HttpResponse:
    with open_static_file("react/index.html") as index_file:
        return HttpResponse(content=index_file)
