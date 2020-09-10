#!/usr/bin/env bash

sbt clean
rm -rf src/main/resources
cp -R src/universal/conf src/main/resources
sbt run
