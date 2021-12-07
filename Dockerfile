FROM node:latest
WORKDIR /app
COPY package.json ./app
RUN apt update
RUN apt install nodejs -y
COPY . ./
RUN npm install -g npm
RUN npm install --save nodemon
CMD ["npm", "run", "startBackend"]