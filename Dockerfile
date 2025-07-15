# Base node image with pnpm
# ===================================
FROM node:24.2.0-bookworm-slim AS node_base

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates coreutils git
RUN npm install -g pnpm@10.8.1
WORKDIR /app/soldera
RUN groupadd -g 5002 apps && \
   useradd --uid=5002 --gid=apps --create-home apps && \
   mkdir react/ && \
   chown -R apps:apps . && \
   mkdir /home/apps/.pnpm-store && \
   chown apps: /home/apps/.pnpm-store
USER apps
RUN pnpm config set store-dir=/home/apps/.pnpm-store

# React base image (no dev deps)
# ==============================
FROM node_base AS react_base
USER apps
WORKDIR /app/soldera
COPY --chown=apps:apps package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=soldera-node-pnpm-cache,target=/home/apps/.pnpm-store,uid=5002,gid=5002 \
   # Ignore scripts, because of bug in `pnpm` which always runs `prepare` - https://github.com/pnpm/pnpm/issues/7068
   pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --chown=apps:apps react/ ./react/


# React production build image
# ============================
FROM react_base AS react_release
USER apps

# Build and then delete everything except build/ directory.
ENV CI=true
RUN CI=true pnpm run build && \
   mv react/build/ ./ && rm -rf react/* && mv build/ react/build/ && \
   find react/build/ -type f '(' -name '*.css' -o -name '*.js' ')' | xargs -P 4 gzip -k --
RUN rm -rf node_modules

# Base Python image used for building, testing and running Soldera
# ==============================================================
FROM python:3.13.5-slim-bookworm AS python_base
LABEL maintainer="Märt Häkkinen <m4rth4kkinen@gmail.com>"


# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends vim curl unzip putty-tools nginx libssl-dev libldap2-dev libxml2-dev libxslt1-dev make git openssl gcc libffi-dev libsasl2-dev libaio1 libpq-dev
ENV POETRY_VIRTUALENVS_IN_PROJECT=true

COPY varia/container-requirements.txt /root/container-requirements.txt
RUN --mount=type=cache,id=soldera-root-pip-cache-bookworm,target=/root/.cache/pip \
   REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
     pip3 install --upgrade setuptools pip -r /root/container-requirements.txt && \
   useradd --uid=5002 --gid=users --home-dir=/app --create-home apps && \
   mkdir /app/soldera /app/conf && \
   chown apps:users /app/soldera && \
   chown -R apps:users /var/log/nginx /var/lib/nginx
COPY conf/soldera.crt.pem /app/conf/soldera.crt.pem
COPY conf/soldera.key.pem /app/conf/soldera.key.pem


WORKDIR /app/soldera
USER apps
COPY pyproject.toml poetry.lock /app/soldera/


# Install base Python packages
RUN --mount=type=cache,id=soldera-apps-poetry-cache-bookworm,target=/app/.cache/pypoetry,uid=5002,gid=100 \
   poetry check --lock && \
   REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
   poetry install --only=main --no-root



# Soldera Python runtime image
# ==========================
FROM python_base AS python_base_installed

USER root
COPY . /app/soldera/
RUN poetry install


FROM python_base_installed AS soldera_runtime
# compileall is done as root so we don't have to chmod all files (which would duplicate them to the new Docker layer).
# -j0 uses all available CPUs.
RUN python3 -m compileall -j0 -q .

# Copy compiled react files and node_modules
COPY --from=react_release /app/soldera/ .

# Remove temp directory, if we have created on.
RUN rm -rf temp

USER apps
# Create a new temp directory for user apps, we'll need it to save xlsx.
RUN mkdir temp

ENV SOLDERA_VAR_DIR=/app/var SOLDERA_CONF_DIR=/app/conf
RUN poetry run soldera collectstatic --no-input --link -v 0


# Soldera app production image
# ==========================
FROM soldera_runtime AS release
CMD ["supervisord", "-c", "/app/soldera/varia/supervisord.conf"]

EXPOSE 8000 8443

HEALTHCHECK --interval=30s --start-period=2m --retries=3 \
   CMD curl -kf https://localhost:8443/servicestatus || exit 1
