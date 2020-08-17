FROM node:12-alpine

ENV PORT 80

RUN apk --update add git

WORKDIR /app

ADD . /app

RUN npm i

<<<<<<< HEAD
ENTRYPOINT npm start
=======
RUN npm start
>>>>>>> 88e2a02c0210e75c08dc0bcab4ab0526c3bbae79
