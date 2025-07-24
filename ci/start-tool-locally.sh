#!/bin/bash

docker stop annotation-tools

docker rm annotation-tools

docker run -p 3000:3000 -d --name annotation-tools  annotation-tools:latest