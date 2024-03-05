#!/bin/sh

docker rm -f crawler
docker build --platform linux/amd64 -t docker-image:test .
docker rmi $(docker images -f "dangling=true" -q)
docker run -d -v ~/.aws-lambda-rie:/aws-lambda -p 9000:8080 --name crawler \
    --entrypoint /aws-lambda/aws-lambda-rie \
    docker-image:test \
    /usr/local/bin/npx aws-lambda-ric index.handler