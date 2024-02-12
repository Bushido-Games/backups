FROM node:18-bookworm

ENV TZ Europe/Warsaw
ENV PACKAGE_NAME backups-api

WORKDIR /app

COPY ./submodules/backups/packages/backups-api/tools.sh ./submodules/backups/packages/backups-api/package.json yarn.lock ./

RUN bash -c "./tools.sh"

RUN yarn install

COPY ./submodules/backups/packages/backups-api/dist .
