require("dotenv").config();

module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "24h",
  },
  server: {
    port: process.env.PORT || 3000,
  },
};
