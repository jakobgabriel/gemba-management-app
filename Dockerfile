FROM nginx:1.27-alpine

LABEL org.opencontainers.image.source="https://github.com/jakobgabriel/gemba-management-app"
LABEL org.opencontainers.image.description="Gemba Management System - Shopfloor Management Platform"

# Copy the application
COPY gemba-management.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

EXPOSE 8080

USER nginx

CMD ["nginx", "-g", "daemon off;"]
