# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Install curl so that healthcheck commands (if using curl) succeed in the container
RUN apk add --no-cache curl

# Copy the rest of the application code
COPY . .

# Install curl for health checks
RUN apk add --no-cache curl

# We rely on the default 'node' non-root user provided by the official Node image here.
# The base image includes a 'node' user, so avoid creating custom users to prevent mismatch.
RUN chown -R node:node /app
USER node

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the application
CMD ["npm", "start"]