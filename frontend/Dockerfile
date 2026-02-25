FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine

LABEL org.opencontainers.image.source="https://github.com/jakobgabriel/gemba-management-app"
LABEL org.opencontainers.image.description="Gemba Management System - Frontend"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

EXPOSE 8080

USER nginx

CMD ["nginx", "-g", "daemon off;"]
