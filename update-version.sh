#!/bin/sh
sed -i -r "s/version=\".*\"/version=\"0.$CIRCLECI_BUILD_NUM\"/" config.xml
sed -i -r "s/\"version\": \".*\"/\"version\": \"0.$CIRCLECI_BUILD_NUM\"/" package.json