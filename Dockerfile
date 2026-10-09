FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
# Bookings are saved here unless DATABASE_URL is set. Mount a volume on /app/data to keep them.
ENV DATA_DIR=/app/data
EXPOSE 3000
CMD ["node", "server.js"]
