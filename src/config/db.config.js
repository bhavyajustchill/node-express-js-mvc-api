require("dotenv").config();
const mongoose = require("mongoose");

const attemptConnnection = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    mongoose.set("strictQuery", false);
    await mongoose.connect(mongoURI);
    console.log("Successfuly connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB: ", err.message);
    process.exit(1);
  }
};

module.exports = attemptConnnection;
