# Stage 1: Build the React app.
FROM node:16-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the production build with Nginx.
FROM nginx:alpine

# Copy the built app to Nginx's default directory.
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
