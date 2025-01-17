require("dotenv").config();
const express = require("express");
const cors = require("cors");
const attemptConnnection = require("./config/db.config");
const stopBackendMiddleware = require("./middlewares/dangerous.middleware");
const {
  notFoundMiddleware,
  internalServerErrorMiddleware,
} = require("./middlewares/errors.middleware");
const todoRoutes = require("./routes/todo.route");
const paymentRoutes = require("./routes/payment.route");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Connct to MongoDB
attemptConnnection();

// API Routes
app.get("/", (req, res) => {
  return res.status(200).json({ message: "API is Live" });
});
app.use("/todo", todoRoutes);
app.use("/payment", paymentRoutes);

// Middleware
app.post("/dangerous/stop/backend", stopBackendMiddleware);
app.use(notFoundMiddleware);
app.use(internalServerErrorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
