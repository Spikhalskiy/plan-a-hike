#!/bin/bash

# Script to pack Chrome extension files for publishing
# Created on June 4, 2025

echo "Packing Chrome extension for publishing..."

# Extract current version from manifest.json (moved earlier)
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
echo "Current version: $CURRENT_VERSION"

# Create output directory
mkdir -p out

# Create a temporary directory for files to be included
mkdir -p out/temp_extension

# Copy all necessary files
cp manifest.json out/temp_extension/
cp hiking-time-calculator.js out/temp_extension/
cp chrome-plugin.css out/temp_extension/
cp chrome-plugin-common.js out/temp_extension/
cp tooltip.js out/temp_extension/
cp chrome-plugin.js out/temp_extension/
cp popup.html out/temp_extension/
cp popup.js out/temp_extension/

# Copy image directory
mkdir -p out/temp_extension/img
cp img/*.png out/temp_extension/img/

# Create the zip file with current version in the filename
zip_filename="out/plan-a-hike-v${CURRENT_VERSION}.zip"
# Change to the temp_extension directory before zipping to make files appear at root level
cd out/temp_extension || exit
zip -r "../../$zip_filename" ./*
cd ../../

# Clean up temporary directory
rm -rf out/temp_extension

echo "Extension packed successfully as $zip_filename"

# Increment the minor version in manifest.json
echo "Incrementing minor version in manifest.json..."

# Split version string into major and minor parts
if [[ $CURRENT_VERSION == *"."* ]]; then
  MAJOR_VERSION=$(echo $CURRENT_VERSION | cut -d'.' -f1)
  MINOR_VERSION=$(echo $CURRENT_VERSION | cut -d'.' -f2)
  # Increment minor version
  NEW_MINOR_VERSION=$((MINOR_VERSION + 1))
  NEW_VERSION="$MAJOR_VERSION.$NEW_MINOR_VERSION"
else
  # If version has no dot, treat it as major version and add .1
  NEW_VERSION="$CURRENT_VERSION.1"
fi

# Update the version in manifest.json
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" manifest.json

echo "Version updated to $NEW_VERSION"
