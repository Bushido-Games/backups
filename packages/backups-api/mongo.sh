#!/bin/bash

MONGO_DIR="/opt/mongo"

if [[ -f "$MONGO_DIR/mongodump" && -f "$MONGO_DIR/mongorestore" && -f "$MONGO_DIR/mongosh" ]]
then
    echo "Mongo already exists, continuing..."
    exit 0
fi

rm -rf $MONGO_DIR
mkdir -p $MONGO_DIR
cd $MONGO_DIR

# https://www.mongodb.com/try/download/database-tools
TOOLS_DISTRO="debian11"
TOOLS_ARCH="x86_64"
TOOLS_VERSION="100.7.0"
TOOLS_NAME="mongodb-database-tools-$TOOLS_DISTRO-$TOOLS_ARCH-$TOOLS_VERSION"

echo "Downloading [$TOOLS_NAME]..."
wget -nv https://fastdl.mongodb.org/tools/db/$TOOLS_NAME.tgz

echo "Extracting [$TOOLS_NAME]..."
tar -xf $TOOLS_NAME.tgz

echo "Moving tools..."
mv $TOOLS_NAME/bin/mongodump .
mv $TOOLS_NAME/bin/mongorestore .

echo "Cleaning up tools..."
rm -rf $TOOLS_NAME.tgz $TOOLS_NAME/

# https://www.mongodb.com/try/download/shell
SHELL_VERSION="1.8.0"
SHELL_OS="linux"
SHELL_ARCH="x64"
SHELL_OPENSSL="11"
SHELL_NAME="mongosh-$SHELL_VERSION-$SHELL_OS-$SHELL_ARCH-openssl$SHELL_OPENSSL"

echo "Downloading [$SHELL_NAME]..."
wget -nv https://downloads.mongodb.com/compass/$SHELL_NAME.tgz

echo "Extracting [$SHELL_NAME]..."
tar -xf $SHELL_NAME.tgz

echo "Moving shell..."
mv $SHELL_NAME/bin/mongosh .

echo "Cleaning up shell..."
rm -rf $SHELL_NAME.tgz $SHELL_NAME/

echo "Done!"
