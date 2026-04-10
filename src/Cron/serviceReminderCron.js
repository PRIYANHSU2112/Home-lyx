const cron = require("node-cron");
const bookingModel = require("../models/bookingModel");
const {sendNotificationToUserOnServiceBooking} = require("../controllers/notificationController")


cron.schedule("*/1 * * * *", async () => {
    try {
        const now = new Date();


        const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const oneDayBookings = await bookingModel.find({
            serviceDateTime: { $lte: oneDayLater, $gt: now },
            oneDayReminderSent: false,
            bookingStatus: "UPCOMING"
        })

        for (const booking of oneDayBookings) {
            await sendNotificationToUserOnServiceBooking(booking, "scheduled for tomorrow");
            booking.oneDayReminderSent = true;
            await booking.save();
        }

        const twoHourBookings = await bookingModel.find({
            serviceDateTime: { $lte: twoHoursLater, $gt: now },
            twoHourReminderSent: false,
            bookingStatus: "UPCOMING"
        })

        for (const booking of twoHourBookings) {
            await sendNotificationToUserOnServiceBooking(booking, "scheduled with in 2h");
            booking.twoHourReminderSent = true;
            await booking.save();
        }
    } catch (error) {
        console.error("Service reminder cron error:", error.message);
    }
})