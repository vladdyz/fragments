# fragments

**Fragments** is a cloud-based microservice intended to facilitate the handling of small pieces 
of data (fragments) and transform the connectivity, digitalization, and automation of the current 
mode of operation for Canadian manufacturing. It achieves this by acting as a highly scalable 
service that interconnects with the network of existing internal sub-systems and facilitates their 
capabilities of working with different lightweight data types such as text-based formats or images, 
specifically for storage and retrieval. 

The companion fragments user interface web application repo can be accessed [here](https://github.com/vladdyz/fragments-ui).
It allows users to authenticate via Amazon Cognito and interact with the microservice through a browser.

A live demonstration video of the microservice can be viewed here [here](https://www.youtube.com/watch?v=4rko1W3KC9I) 

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

### npm test

Runs testing using the jest module, note that this entails using separate environmental variable configuration. This is used to distinguish the authentication flow in the production environment (where it uses Cognito) from the testing environment (which uses hardcoded users in the .htpasswd file). Note that the htpasswd file must store credentials in the format of email (as username) and hashed password as these are the expected parameters in the auth-middleware callback.

The test suites are contained in the tests/\* directories, grouped accordingly (e.g. unit tests in the tests/unit folder, and so on). The nomenclature consists of the type of test, the word "test" and the file extension, delimited by dots. E.g. the 'response.test.js' test suite contains tests that expect success/error responses to be returned, the health.test.js suite contains tests to validate the health and connectivity of the app, etc.

To run specific individual test suites, append the name of the file to the command : npm test get.test.js

### npm test:watch

Same as above, except responsive to changes in realtime by watching the files instead of terminating immediately after the testing concludes. Re-runs the tests when a change is detected. Also works with individual test suites.

### nmp test:integration

Runs the integration test suite, simulating AWS & DynamoDB locally. Must first set up environment (docker compose up --build -d) and run the local-aws-setup.sh script in Git Bash. This test suite has been integrated into CI as of v0.10.0.

### npm run coverage

In addition to running tests, also collects detailed coverage information. Displays the files that were included in the testing, providing a breakdown of the statements, branches, functions, and lines covered by the tests. Useful to identify which parts of the code aren't included in the tests by their line #s. Provides an overall coverage % of the breakdowns.

Also shows a much more elaborate web version of the report by opening the file coverage/lcov-report/index.html in the browser (the coverage/ directory will have been created when you ran the command above).

### local-aws-setup.sh

Simulates app AWS functionality by setting up LocalStack to mock S3 bucket storage and DynamoDB (metadata) for testing. Integral to verifying functionality of new features prior to push via integration test suites (we want to confirm everything works as it is expected to before putting the new code through the lengthy CI/CD processes and redeployment to AWS). Requires AWS CLI installation. To run, execute the `docker compose up --build -d` command, in Git Bash configure the local-aws-setup.sh to run as an executable if not already done so (chmod +x ./scripts/local-aws-setup.sh), and execute `.scripts/local-aws-setup.sh`. Verify S3 bucket, database, and mock AWS envara are set up prior to running integration testing (see `npm run test:integration`).

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

### HTTP-Auth & HTTP-Auth-Passport

Node.js package for HTTP basic and digest access authentication & the Passport.js integration. Used with the htpasswd utility. Tests basic user authentication without the need to overcomplicate the test setup with Cognito User Pools and Authentication UI/domains. Uses the hardcoded test accounts within .htpasswd instead.

### Markdown-It

Supports conversion of Markdown (.MD) fragments (currently only to HTML) via the :id.ext path params and file extension (e.g. use the id of a Markdown fragment and append HTML)

### AWS-SDK/client-s3

S3 AWS SDK for JavaScript to work with the Amazon S3 bucket for storing fragments, replacing the previous in-memory database for back-end storage in Fragments 0.7.x versions and below.

### Sharp

High performance Node.js image processing for converting image-based fragments to other types. Current supported types include PNG, JPG/JPEG, WEBP, AVIF and GIF. At present, conversion to text-based fragments (e.g. MIME types of text/plain, text/markdown, text/html, text/csv) and JSON/YAML data not supported.

### JS-YAML

YAML parser for fragment supported type conversions. Conversion via the :id.ext path param and file extension. Current supported types include direct JSON to YAML/YML and plain text conversion.

### Csvtojson

CSV parser for fragment supported type conversion (CSV->JSON).

## Development Dependencies

### ESLint

Code analysis tool for identifying and fixing problems. See `npm run lint`

### Prettier

Opinionated code formatter. Makes it less painful for others to peruse my code.

### Globals

Used by ESLint

### Jest

Used for testing and debugging purposes

### Supertest

HTTP assertion module used to write tests for REST APIs, creates HTTP requests to Express routes and allows writing assertions about what kind of response code & body is expected to be returned from those routes

## Modules

### Server.js

Supports Index.js as the entry point for the app, server starts here. Gets instances and starts listening.

### App.js

Routes and middleware currently here

### Logger.js

Structured logging using Pino, this is the configuration file.

### Cognito.js / Basic-Auth.js

Secure Cognito JTW Authentication for AWS / Test module equivalent for HTTP authentication using hardcoded users from HTPASSWD

### Hash.js

Encrypts user data to store hashed email addresses instead of as lain-text

### Auth-middleware

Authentication middleware used in fragments routes, also hashes the user's email address (ownerId) on requests

### Index.js

The main entrypoint for each directory (currently: src, routes, api, auth).

### response.js

Defines what successful & unsuccessful should look like for testing purposes

### API /

The main entry-point for the v1 version of the fragments API, currently includes GET, POST, and DELETE routes to store, retrieve, and remove fragments (Get.js/Post.js/Delete.js).
The GET route now supports params (e.g. /v1/fragments/{id}) to return a specific text-based (or JSON) fragment, provided the user is authenticated and the owner of the fragment. Appending /info allows metadata retrieval instead.

### Model /

Defines the fragment data model (Fragment.js) and associated methods (read/write/list/delete) as well as an In-Memory mock database backend to store fragments (to be replaced by AWS backend data stores in future versions)

### Tests /

The files in this directory are specifically test suites & cases for project code coverage, to validate that the code pushed to main is working as expected. These are also integrated into the CI pipeline along with ESLint - a commit will fail if it does not pass one or more of these tests!

### ci/cd.yml

Configuration for CI/CD. Upon successful completion of all jobs on a push the following takes place:

- Linting and Unit Testing is performed concurrently on the files
- A Docker image of the Fragments API server is built and pushed to the fragments repository on Docker Hub
- If a new version tag is detected and the CI successfully passes, the Fragments docker image is pushed to the Amazon Elastic Container Registry (secrets must be updated accordingly)
