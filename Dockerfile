# Instructions for building a Fragments image to deploy to a server
# Must start with a FROM directive, using same node version as the project
# Refactored to use multi-stage builds



# DEPENDENCIES
###################################################################################################

FROM node:22.19.0@sha256:afff6d8c97964a438d2e6a9c96509367e45d8bf93f790ad561a1eaea926303d9 AS dependencies

LABEL maintainer="Vladislav Zolotukhin <vzolotukhin@myseneca.ca"
LABEL description="Fragments node.js microservice dependencies"

# Set environment variable port to use 8080 for the service
ENV PORT=8080

# Specify we are in a production environment
ENV NODE_ENV=production

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

WORKDIR /app/

# Copy both package.json & package-lock.json to app directory
COPY package*.json /app/

# Install node dependencies defined in package-lock.json, omit anything non-production
RUN npm ci --production


# PRODUCTION
####################################################

# Using Alpine for smallest possible Linux distro, original node:22.19.0 docker images are ~1.2GB!
# Version Specific and SHA digest pinned using official Alpine Linux package
FROM node:22.19.0-alpine3.22.2@sha256:704b199e36b5c1bc505da773f742299dc1ee5a4c70b86d1eb406c334f63253c6

LABEL maintainer="Vladislav Zolotukhin <vzolotukhin@myseneca.ca"
LABEL description="Fragments node.js microservice"

WORKDIR /app/

COPY --from=dependencies /app/node_modules ./node_modules 


# When running this docker image, avoid running it as the default root user as this poses a security risk
# Use the pre-defined non-privileged "node" user and set the ownership for the source code

# Copy source files (src) to /app/src/ and the package* files
COPY --chown=node:node ./src ./src
COPY --chown=node:node package*.json ./

# Copy our HTPASSWD file
COPY --chown=node:node ./tests/.htpasswd ./tests/.htpasswd

# Alpine needs curl installed to run the healthcheck 
# Also require tini to use as our init process so combine both these commands into one
RUN apk add --no-cache curl=8.10.1-r1 tini=0.19.0-r2

USER node 

# The Docker container needs to expose the port to run the health check on localhost
EXPOSE 8080 

# Every 30 minutes run the healthcheck to make sure the server is responding
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Use tini for the init process (PID 1), we specify it as the entrypoint
# This can also be done by appending "--init" to the docker run command 
# but lets not make that command any longer than it already is...
ENTRYPOINT ["/sbin/tini", "--"]



# Start the container by running our server
CMD ["npm", "start"]
