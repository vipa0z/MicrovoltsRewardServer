const chalk = require("chalk");
const winston = require("winston");

exports.winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    new winston.transports.File({
      filename: "public/wheel.log",
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, message, itemName }) =>
          `${timestamp} | ${message} | ${itemName ?? ''}`
        )
      )
    })
  ]
});

exports.logger = {
  info: (...args) => {
    console.log(chalk.blue("[INFO]"), ...args);
  },
  success: (...args) => {
    console.log(chalk.green("[SUCCESS]"), ...args);
  },
  warn: (...args) => {
    console.warn(chalk.yellow("[WARN]"), ...args);
  },
  error: (...args) => {
    // Print message(s), and if any arg is an Error, also print its stack.
    const hasError = args.some(a => a instanceof Error);
    console.error(chalk.red("[ERROR]"), ...args);
    if (hasError) {
      for (const a of args) {
        if (a instanceof Error) {
          console.error(chalk.red("[STACK]"), a.stack);
        }
      }
    }
  }
};

