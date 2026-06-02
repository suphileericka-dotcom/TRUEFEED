FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 4000

CMD ["npm", "start"]
