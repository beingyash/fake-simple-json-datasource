FROM node:12-alpine

ENV PORT 80

RUN apk --update add git

WORKDIR /app

ADD . /app

RUN npm i

RUN npm start
