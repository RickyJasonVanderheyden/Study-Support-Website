# Node version
FROM node:20-alpine

# Working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose frontend port (CRA default)
EXPOSE 3000

# Allow CRA to run in a container correctly
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# Start the React app
CMD ["npm", "start"]
