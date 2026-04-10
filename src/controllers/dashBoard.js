const { userType } = require("../helper/userType");

const userModel = require("../models/userModel");
// const orderModel = require("../models/orderModel"); // old (if you still use)
const ecommerceOrderModel = require("../models/ecommerce/orderModel");
const bookingModel = require("../models/bookingModel");

// ================== Admin Dashboard ==================
exports.dashBoard = async (req, res) => {
  try {
    const { adminId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    if (!adminId) {
      return res
        .status(400)
        .send({ success: false, message: "adminId is required" });
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // =========================
    // USERS
    // =========================
    const allUsers = await userModel.find();

    const userData = Object.values(userType).reduce(
      (acc, type) => ({
        ...acc,
        [type]: allUsers.filter((u) => u.userType.includes(type)).length,
      }),
      {},
    );

    // =========================
    // SERVICE SECTION (Bookings)
    // =========================
    const serviceCounts = {
      TOTAL_BOOKING: await bookingModel.countDocuments(),
      PENDING_BOOKING: await bookingModel.countDocuments({
        bookingStatus: "PENDING",
      }),
      UPCOMING_BOOKING: await bookingModel.countDocuments({
        bookingStatus: "UPCOMING",
      }),
      COMPLETED_BOOKING: await bookingModel.countDocuments({
        bookingStatus: "COMPLETED",
      }),
      CANCELLED_BOOKING: await bookingModel.countDocuments({
        bookingStatus: "CANCELLED",
      }),
      REFUNDED_BOOKING: await bookingModel.countDocuments({
        bookingStatus: "REFUNDED",
      }),
    };

    // =========================
    // ECOMMERCE SECTION (Orders)
    // =========================
    // ⚠️ update these statuses according to your OrderEcommerce enum
    const ecommerceCounts = {
      TOTAL_ORDER: await ecommerceOrderModel.countDocuments(),
      ORDERED_ORDER: await ecommerceOrderModel.countDocuments({
        status: "PENDING",
      }),
      SHIPPED_ORDER: await ecommerceOrderModel.countDocuments({
        status: "SHIPPED",
      }),
      OUT_FOR_DELIVERY_ORDER: await ecommerceOrderModel.countDocuments({
        status: "OUT_FOR_DELIVERY",
      }),
      DELIVERED_ORDER: await ecommerceOrderModel.countDocuments({
        status: "DELIVERED",
      }),

      RETURN_REQUESTED_ORDER: await ecommerceOrderModel.countDocuments({
        status: "RETURN_REQUESTED",
      }),
      RETURN_APPROVED_ORDER: await ecommerceOrderModel.countDocuments({
        status: "RETURN_APPROVED",
      }),
      RETURNED_ORDER: await ecommerceOrderModel.countDocuments({
        status: "RETURNED",
      }),
      REFUNDED_ORDER: await ecommerceOrderModel.countDocuments({
        status: "REFUNDED",
      }),
    };

    const totalActivity =
      ecommerceCounts.TOTAL_ORDER + serviceCounts.TOTAL_BOOKING;

    // =========================
    // TURNOVER (Order + Booking)
    // =========================
    const allOrders = await ecommerceOrderModel.find({}, { orderTotal: 1 });
    const allBookings = await bookingModel.find({}, { finalPayableAmount: 1 });

    let totalTurnover = 0;

    allOrders.forEach((o) => {
      if (o.orderTotal) totalTurnover += o.orderTotal;
    });

    allBookings.forEach((b) => {
      if (b.finalPayableAmount) totalTurnover += b.finalPayableAmount;
    });

    // =========================
    // MONTHLY GRAPH (Year filter)
    // =========================
    const ordersInYear = await ecommerceOrderModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const bookingsInYear = await bookingModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const usersInYear = await userModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const monthly = {
      orders: {},
      bookings: {},
      users: {},
    };

    for (let m = 0; m < 12; m++) {
      const monthName = new Date(year, m).toLocaleString("en-US", {
        month: "long",
      });
      monthly.orders[monthName] = 0;
      monthly.bookings[monthName] = 0;
      monthly.users[monthName] = 0;
    }

    ordersInYear.forEach((o) => {
      const monthName = o.createdAt.toLocaleString("en-US", { month: "long" });
      monthly.orders[monthName]++;
    });

    bookingsInYear.forEach((b) => {
      const monthName = b.createdAt.toLocaleString("en-US", { month: "long" });
      monthly.bookings[monthName]++;
    });

    usersInYear.forEach((u) => {
      const monthName = u.createdAt.toLocaleString("en-US", { month: "long" });
      monthly.users[monthName]++;
    });

    // =========================
    // WEEKDAY GRAPH (Last 7 days)
    // =========================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const ordersLast7Days = await ecommerceOrderModel.find({
      createdAt: { $gte: sevenDaysAgo, $lte: new Date() },
    });

    const bookingsLast7Days = await bookingModel.find({
      createdAt: { $gte: sevenDaysAgo, $lte: new Date() },
    });

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const weekday = {
      orders: {},
      bookings: {},
    };

    weekdays.forEach((d) => {
      weekday.orders[d] = 0;
      weekday.bookings[d] = 0;
    });

    ordersLast7Days.forEach((o) => {
      weekday.orders[weekdays[o.createdAt.getDay()]]++;
    });

    bookingsLast7Days.forEach((b) => {
      weekday.bookings[weekdays[b.createdAt.getDay()]]++;
    });

    // =========================
    // FINAL RESPONSE (DIVIDED)
    // =========================
    return res.status(200).send({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        year,
        totalTurnover,
        total: totalActivity,

        users: {
          total: allUsers.length,
          userTypeCounts: userData,
        },

        ecommerce: {
          counts: ecommerceCounts,
          graphs: {
            monthlyOrders: monthly.orders,
            weekdayOrders: weekday.orders,
          },
        },

        service: {
          counts: serviceCounts,
          graphs: {
            monthlyBookings: monthly.bookings,
            weekdayBookings: weekday.bookings,
          },
        },

        commonGraphs: {
          monthlyUsers: monthly.users,
        },
      },
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};
