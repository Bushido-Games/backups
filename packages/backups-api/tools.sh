#!/bin/bash

TOOLS_DIR="/opt/tools"

if [[ -f "$TOOLS_DIR/mongodump" && -f "$TOOLS_DIR/mongorestore" && -f "$TOOLS_DIR/mongosh" && -f "$TOOLS_DIR/b2" ]]
then
    echo "Tools already exist, continuing..."
    exit 0
fi

rm -rf $TOOLS_DIR
mkdir -p $TOOLS_DIR
cd $TOOLS_DIR

# https://www.mongodb.com/try/download/database-tools
TOOLS_DISTRO="debian11" # No version for Debian 12 has been released yet, but this is compatible as of 100.9.x
TOOLS_ARCH="x86_64"
TOOLS_VERSION="100.9.4"
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
SHELL_VERSION="2.1.4"
SHELL_OS="linux"
SHELL_ARCH="x64"
SHELL_OPENSSL="3" # 1.1 for <= Debian 11, 3 for >= Debian 12
SHELL_NAME="mongosh-$SHELL_VERSION-$SHELL_OS-$SHELL_ARCH-openssl$SHELL_OPENSSL"

echo "Downloading [$SHELL_NAME]..."
wget -nv https://downloads.mongodb.com/compass/$SHELL_NAME.tgz

echo "Extracting [$SHELL_NAME]..."
tar -xf $SHELL_NAME.tgz

echo "Moving shell..."
mv $SHELL_NAME/bin/mongosh .

echo "Cleaning up shell..."
rm -rf $SHELL_NAME.tgz $SHELL_NAME/

# https://github.com/Backblaze/B2_Command_Line_Tool/releases
B2_VERSION="3.15.0"
B2_OS="linux"
B2_NAME="b2-$B2_OS"

echo "Downloading [$B2_NAME]..."
wget -nv https://github.com/Backblaze/B2_Command_Line_Tool/releases/download/v$B2_VERSION/$B2_NAME

echo "Marking b2 as executable..."
chmod +x $B2_NAME

echo "Renaming b2..."
mv $B2_NAME b2-cli

echo "Done!"
