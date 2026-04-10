console.log("Starting server setup...");

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");

require("dotenv").config();

// Models
const taxModel = require("./src/models/taxModel");
const commpanyModel = require("./src/models/commpanyModel");
const partnerProfileHomeModel = require("./src/models/partnerProfileHomeModel");
const userModel = require("./src/models/userModel");
const shipingModel = require("./src/models/ecommerce/shippmentCharges");

// Cron Jobs
require("./src/Cron/serviceReminderCron");
const { startSettlementCron } = require("./src/services/settlementCron");

const app = express();
const server = http.createServer(app);

app.use("/public", express.static(path.join(__dirname, "public")));

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:9000",
  "http://localhost:5501",
  "http://192.168.29.17:5501",
  "http://172.20.10.4:5501",
  "https://api.homelyx.framekarts.com",
  "https://homelyx.framekarts.com",
  "https://admin.homelyx.framekarts.com",
  "https://www.essindiaonline.com",
  "https://admin.homelyx.framekarts.com",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5173",
  "http://192.168.29.16:5501",
  "http://192.168.29.17:5502",
  "http://127.0.0.1:5502",
  "http://localhost:2000",
];

app.use((req, res, next) => {
  try {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  } catch (e) {
    console.error("CORS Middleware Error:", e.message);
    res.status(500).json({
      success: false,
      message: "CORS Middleware Failed",
    });
  }
});

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(__dirname + "/components"));

// ✅ Log Requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Socket.IO Setup
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ WebSocket client connected");
  socket.emit("connection", "Connected to WebSocket server");
});

module.exports = { io };

// ✅ MongoDB Connection
mongoose.set("strictQuery", true);
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://sahujipriyanshu2112_db_user:Priyanshu123@cluster0.srclyqf.mongodb.net/homelxy?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => {
    console.log("✅ MongoDB connected");
    initializeDatabase();

    // Start settlement cron job (runs daily at 2 AM UTC)
    startSettlementCron("0 2 * * *");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// ✅ Route Registration
const routes = [
  "./src/routes/PhonePayGatewayRoute",
  "./src/routes/categoryRoute",
  "./src/routes/cityRoute",
  "./src/routes/productRoute",
  "./src/routes/reviewRoute",
  "./src/routes/userRoute",
  "./src/routes/cartRoute",
  "./src/routes/membershipRoute",
  "./src/routes/couponRoute",
  "./src/routes/orderRoute",
  "./src/routes/patnerProfileRoute",
  "./src/routes/homeBannerRoute",
  "./src/routes/homeCategoryCartRoute",
  "./src/routes/appBannerRoute",
  "./src/routes/taxRoute",
  "./src/routes/privacyRoute",
  "./src/routes/contactUsRoute",
  "./src/routes/aboutUsRoute",
  "./src/routes/FAQRoute",
  "./src/routes/ecommerce/CartRoutes",
  "./src/routes/ecommerce/orderRoute",
  "./src/routes/ecommerce/CategoryRoutes",
  "./src/routes/ecommerce/ProductRoutes",
  "./src/routes/ecommerce/reviewRoute",
  "./src/routes/ecommerce/brandRoute",
  "./src/routes/commpanyRoute",
  "./src/routes/homePageRoute",
  "./src/routes/homeProductRoute",
  "./src/routes/ecommerce/homeCategoryCartRoute",
  "./src/routes/ecommerce/homeBannerRoute",
  "./src/routes/ecommerce/homePageRoute",
  "./src/routes/ecommerce/homeProductRoute",
  "./src/routes/ecommerce/addressRoute",
  "./src/routes/ecommerce/searchRoute",
  "./src/routes/searchRoute",
  "./src/routes/ecommerce/appBannerRoute",
  "./src/routes/ecommerce/bestSellerRoute",
  "./src/routes/partnerProfileHomeRoute",
  "./src/routes/notificationRoute",
  "./src/routes/messageRoute",
  "./src/routes/questionRoute",
  "./src/routes/blogRoute.js",
  "./src/routes/ecommerce/wishlistRoute.js",
  "./src/routes/helpSupportRoute.js",
  "./src/routes/ecommerce/transactionRoute.js",
  "./src/routes/bookingRoute.js",
  "./src/routes/bookingPaymentRoute.js",
  "./src/routes/walletRoute.js",
  "./src/routes/feedBackRoute.js",
  "./src/routes/platformFeeRoute.js",
  "./src/routes/refundRoute.js",
  "./src/routes/bankRoute.js",
  "./src/routes/partnerWalletRoute.js",
  "./src/routes/adminSettlementRoute.js",
];

routes.forEach((routePath) => {
  try {
    const route = require(routePath);
    app.use("/api", route);
    console.log(`✅ Route loaded: ${routePath}`);
  } catch (err) {
    console.error(`❌ Error loading route "${routePath}":`, err.message);
  }
});

// ✅ 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ error: "Path not found." });
});

// ✅ Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// ✅ Seed Data Functions
function initializeDatabase() {
  initializeTax();
  initializeUsers();
  initializeCompany();
  initializePartnerProfile();
  initializeShipping();
}

function initializeTax() {
  taxModel.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      taxModel
        .insertMany([
          { taxPercent: 0 },
          { taxPercent: 5 },
          { taxPercent: 12 },
          { taxPercent: 18 },
          { taxPercent: 28 },
        ])
        .then(() => console.log("✅ Tax initialized"));
    }
  });
}

function initializeUsers() {
  userModel.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      const hash = bcrypt.hashSync("123456", 8);
      userModel
        .create({
          _id: "64ddafdb7f21b2c8878e17d5",
          email: "admin1@gmail.com",
          password: hash,
          userType: "SUPER_ADMIN",
          permissions: "ALL",
        })
        .then(() => console.log("✅ Admin user created"));
    }
  });
}

function initializeCompany() {
  commpanyModel.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      commpanyModel
        .create({ site_name: "company name" })
        .then(() => console.log("✅ Company initialized"));
    }
  });
}

function initializePartnerProfile() {
  partnerProfileHomeModel.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      partnerProfileHomeModel
        .create({
          banner: "HomeService/1690967242421logo.png",
          link: "www.satyakabir.com",
        })
        .then(() => console.log("✅ Partner profile initialized"));
    }
  });
}

function initializeShipping() {
  shipingModel.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      shipingModel
        .insertMany([
          { name: "NATIONAL", charge: 89 },
          { name: "ZONAL", charge: 9 },
          { name: "LOCAL", charge: 0 },
        ])
        .then(() => console.log("✅ Shipping charges initialized"));
    }
  });
}
