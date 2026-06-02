function createHttpError(statusCode, error, message, details) {
  const httpError = new Error(message);
  httpError.statusCode = statusCode;
  httpError.error = error;
  httpError.details = details;

  return httpError;
}

module.exports = {
  createHttpError,
};
