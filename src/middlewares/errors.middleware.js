const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({ message: "Route Not Found!" });
};

const internalServerErrorMiddleware = (req, res, next) => {
  res.status(500).json({ message: "Internal Server Error!" });
};

module.exports = { notFoundMiddleware, internalServerErrorMiddleware };
