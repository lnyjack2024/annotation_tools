#!/bin/bash
set -ex

docker tag annotation-tools:latest registry-intl-vpc.cn-zhangjiakou.aliyuncs.com/loonshots/annotation-tools:latest

docker push registry-intl-vpc.cn-zhangjiakou.aliyuncs.com/loonshots/annotation-tools:latest
