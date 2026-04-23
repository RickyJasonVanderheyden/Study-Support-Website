# Node version
FROM node:20-alpine

# Working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies like nodemon)
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start in development mode
CMD ["npm", "run", "dev"]
