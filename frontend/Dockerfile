FROM node:20-alpine

WORKDIR /app

# Copy application code (including node_modules)
COPY . .

EXPOSE 3000

# Development mode with hot reload
CMD ["npm", "run", "dev"]
