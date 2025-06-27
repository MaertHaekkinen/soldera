from typing import IO

from django.contrib.staticfiles import finders


def open_static_file(relative_path: str) -> IO:
    full_path = finders.find(relative_path)
    if not full_path:
        raise OSError

    return open(full_path)
