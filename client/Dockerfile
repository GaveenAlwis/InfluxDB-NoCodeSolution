# Step 1: Build React App
FROM node:22-alpine3.19 as build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# RUN npm run build
CMD ["npm", "start"]
