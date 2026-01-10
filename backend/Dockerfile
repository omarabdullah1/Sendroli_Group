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

# Create the node user if it doesn't exist
# We also use the uid/gid 1000 to match standard practices
RUN deluser --remove-home node \
    && addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

# Ensure the user has ownership of the app directory
RUN chown -R node:node /app

# Switch to the node user
USER node

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the application
CMD ["npm", "start"]