FROM node:18-bullseye

ENV TZ Europe/Warsaw
ENV PACKAGE_NAME backups-api

WORKDIR /app

COPY ./packages/backups-api/mongo.sh ./packages/backups-api/package.json yarn.lock ./

RUN bash -c "./mongo.sh"

RUN yarn install

COPY ./packages/backups-api/dist .
