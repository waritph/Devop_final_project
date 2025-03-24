FROM node:16.14.2-alpine

WORKDIR /app

COPY package.json .
RUN npm install 
COPY . ./
ENV PORT 8080 
EXPOSE $PORT

CMD [ "npm","run", "start" ]