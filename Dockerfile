# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Final image
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# ✅ Copy compiled code and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# ✅ Copy generated Prisma Client ONLY
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]
