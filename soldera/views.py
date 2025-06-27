from rest_framework.response import Response


def healthcheck():
    return Response({"status": "ok"})
