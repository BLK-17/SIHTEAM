# ============================================================
# BUILD STAGE
# ============================================================

FROM node:22-alpine AS build

WORKDIR /app

# Copy package files first for Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build Vite application
RUN npm run build


# ============================================================
# PRODUCTION STAGE
# ============================================================

FROM nginx:alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our SPA nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite production build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]