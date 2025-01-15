const stopBackendMiddleware = (req, res, next) => {
  res.json({
    message: "Stopping Backend! None of the APIs will work from now!",
  });
  process.exit(0);
};

module.exports = stopBackendMiddleware;
