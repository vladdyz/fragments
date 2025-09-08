// Replaces console.log and print statements for detailed debugging for structured logging
// https://github.com/humphd/cloud-computing-for-programmers-fall-2025/blob/main/weeks/week-01/structured-logging.md

/*

Log Levels:

fatal - critical errors that crash the app
error - actual errors that shouldn't have happened 
warn - non-fatal errors that the program can recover from
info - regular app actions you want to be aware of
debug - detailed info useful during debugging only
trace - very detailed tracing info
silent - no logging info (enable this only when running tests)


*/

// Use `info` as our standard log level if not specified
const options = { level: process.env.LOG_LEVEL || 'info' };

// If we're doing `debug` logging, make the logs easier to read
if (options.level === 'debug') {
  // https://github.com/pinojs/pino-pretty
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
  // Using structured logging to debug the environment variables instead
  // console.log(process.env);
}

// Create and export a Pino Logger instance:
// https://getpino.io/#/docs/api?id=logger
module.exports = require('pino')(options);
