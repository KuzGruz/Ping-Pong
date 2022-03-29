FROM node:lts-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --only=prod
COPY . .
EXPOSE 3000
CMD ["npm", "run", "build"]
