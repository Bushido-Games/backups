FROM node:18-bookworm

ENV TZ Europe/Warsaw
ENV PACKAGE_NAME backups-api

WORKDIR /app

COPY ./packages/backups-api/tools.sh ./packages/backups-api/package.json yarn.lock ./

RUN bash -c "./tools.sh"

RUN yarn install

COPY ./packages/backups-api/dist .
