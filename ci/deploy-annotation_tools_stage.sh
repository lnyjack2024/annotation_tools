#!/bin/bash

helm --namespace loonshots-stg uninstall annotation-tools

helm --namespace loonshots-stg upgrade --install -f  charts/annotation_tools/values.stg.yaml --set image.tag=latest  annotation-tools charts/annotation_tools/