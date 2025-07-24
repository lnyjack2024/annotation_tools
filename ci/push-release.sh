#!/bin/bash
set -ex

releaseVersion=`echo ${GIT_COMMIT} | cut -c1-10`

echo "releaseVersion is ${releaseVersion}"

docker tag annotation-tools:latest registry-intl-vpc.cn-zhangjiakou.aliyuncs.com/loonshots/annotation-tools:${releaseVersion}

docker push registry-intl-vpc.cn-zhangjiakou.aliyuncs.com/loonshots/annotation-tools:${releaseVersion}

helm --namespace loonshots-stg upgrade --install -f  ci/charts/annotation-tools/values.stg.yaml  --set image.tag=${releaseVersion} annotation-tools ci/charts/annotation-tools
