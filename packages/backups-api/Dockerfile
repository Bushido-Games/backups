FROM node:18-bullseye

ENV TZ Europe/Warsaw
ENV PACKAGE_NAME backups-api

WORKDIR /app

COPY ./submodules/backups/packages/backups-api/mongo.sh ./submodules/backups/packages/backups-api/package.json yarn.lock ./

RUN bash -c "./mongo.sh"

RUN yarn install

COPY ./submodules/backups/packages/backups-api/dist .
