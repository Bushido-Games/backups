FROM node:18-bookworm

ENV TZ Europe/Warsaw
ENV PACKAGE_NAME backups-cli

WORKDIR /app

COPY ./vault/scripts/envvault /usr/bin/

COPY ./packages/backups-cli/package.json yarn.lock ./

RUN bash -c "apt update && apt install -y nano && curl -fsSL https://get.docker.com | bash -"

RUN yarn install

COPY ./packages/backups-cli/dist .
