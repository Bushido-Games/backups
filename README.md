# 💾 Backups

## 📦 Contents of this repository

#### ➡ [backups-api](packages/backups-api)

- This package contains app written using [Nest.js](https://nestjs.com/) that automatically creates backups of the whole database and provides an API for `backups-cli`.

#### ➡ [backups-cli](packages/backups-cli)

- This package contains the tool that is a command line interface used to interact with `backups-api`. It allows to easily create backup of a database, restore it or even directly copy it between all the envrionments (`local`, `staging`, `prod`).
