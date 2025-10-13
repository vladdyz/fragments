# Instructions for building a Fragments image to deploy to a server
# Must start with a FROM directive, using same node version as the project

FROM node:22.19.0

LABEL maintainer="Vladislav Zolotukhim <vzolotukhin@myseneca.ca"
LABEL description="Fragments node.js microservice"

# Set environment variable port to use 8080 for the service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

WORKDIR /app/

# Copy both package.json & package-lock.json to app directory
COPY package*.json /app/

# Install node dependencies defined in package-lock.json
RUN npm install

# Copy source files (src) to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
CMD npm start
