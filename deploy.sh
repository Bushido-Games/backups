#!/usr/bin/env bash

function error_msg() {
  printf "ERROR:\n  $*\n" >&2
  exit 1
}

STRATEGY="patch"

while test $# -gt 0; do
  case "$1" in
    -s)
      shift
      STRATEGY="$1"
      shift
      ;;
    *)
      break;
      ;;
  esac
done

if [ "patch" != "$STRATEGY" -a "minor" != "$STRATEGY" -a "major" != "$STRATEGY" ]; then
  error_msg "Invalid strategy. Available options: patch, minor, major"
fi

yarn version "$STRATEGY"
node bump.js
git add .yarn/versions

PACKAGE_VERSION=$(cat package.json|grep version|head -1|awk -F: '{ print $2 }'|sed 's/[", ]//g')

git commit -a -m"new version: v${PACKAGE_VERSION}" --no-verify
git tag -a "v${PACKAGE_VERSION}" -m"new version: v${PACKAGE_VERSION}"
git push && git push --tags