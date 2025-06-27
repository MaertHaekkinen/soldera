import os
import signal
import sys

from django.conf.global_settings import DEBUG


def write_stdout(s) -> None:
    sys.stdout.write(s)
    sys.stdout.flush()


def write_log(message) -> None:
    sys.stderr.write(f"[supervisor_event_listener] message {message}\n")
    sys.stderr.flush()


def terminate_supervisor() -> None:
    # Send SIGTERM to the parent process -- supervisord -- so it starts shutdown of all supervised processes
    os.kill(os.getpid(), signal.SIGTERM)


def main() -> None:
    while True:
        write_stdout("READY\n")
        line = sys.stdin.readline().removesuffix("\n")

        headers = {key: val for key, val in (hdr.split(":", maxsplit=1) for hdr in line.split(" "))}
        body = sys.stdin.read(int(headers["len"]))

        event = headers.get("eventname")
        if DEBUG:
            write_log(f"Event: {event} data: {body!r}")

        if event == "PROCESS_STATE_FATAL":
            # When any supervised process dies fatally, stop everything.
            write_log(f"A supervised process has died, terminating everything (data: {body!r}).")

        write_stdout("RESULT 2\nOK")


if __name__ == "__main__":
    main()
