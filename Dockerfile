# FROM node:24-alpine

# WORKDIR /app

# COPY package.json .

# RUN npm install

# COPY . .

# EXPOSE 8084

# CMD [ "npm", "run", "dev" ]

FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 8084

CMD ["npm", "run", "preview", "--", "--host", "--port", "8084"] 