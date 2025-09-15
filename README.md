# fragments

## Script Instructions

### npm run lint

Runs the linter. Identifies and reports bugs and vulnerabilities in the code.

Configurations are the following:

- Uses commonJS modules
- Reports problems
- Is not configured for a particular framework
- Dynamic typing (JavaScript)
- languageOptions set to node (globals.node), NOT globals.browser

### npm start

Starts the server in production mode on port 8080 : http://localhost:8080/

### npm run debug

Allows the server to run while connecting the VSCode debugger to the process, useful for setting breakpoints, checking the value of variables at a given point in the code, and observing the callstack. Relies on the .vscode/launch.json script.

Currently, environment variables are logged when running this script via Pino.

### npm run dev

Starts the server in the development environment on port 8080.
Why run this instead of npm start?

- Fast refresh, view changes in code instantly without manually refreshing the page
- Add or remove modules while app is running
- Easier to debug and develop app, improving workflow

## Dependencies

### Compression

This middleware is used in compressing response bodies for all requests

### CORS

Cross-Origin Resource Sharing middleware. Allows web pages to access restricted resources from a server/domain different than the one that serves the page.

### Helmet

Security middleware used to set HTTP response headers (for a default list see https://helmetjs.github.io/)

### Express

We're going to build some RESTful APIs with node and have lots of routes and req/res

### Pino

Used for structured logging, more detailed and robust than spamming console.log and print statements throughout various routes and functions to see where the code goes

### Stoppable

Lets the server exit gracefully, waits until current connections are finished before shutting down

### Passport

Authenticates user credentials

### Passport-HTTP-Bearer

Authenticates HTTP requests using bearer tokens, verifying user credentials to protect API endpoints

### AWS JWT Verify

Used here with Amazon Cognito, this is a JS library solely for verifying signed JWTs

### Dotenv

Loads environmental variables into process.env for use throughout this app

## Development Dependencies

### ESLint

Code analysis tool for identifying and fixing problems. See `npm run lint`

### Prettier

Opinionated code formatter. Makes it less painful for others to peruse my code.

### Globals

Used by ESLint

## Modules

### Server.js

Supports Index.js as the entry point for the app, server starts here. Gets instances and starts listening.

### App.js

Routes and middleware currently here

### Logger.js

Structured logging using Pino, this is the configuration file.

### Auth.js

Secure Cognito JTW Authentication for AWS

### Index.js

The main entrypoint for each directory (currently: src, routes, api).
