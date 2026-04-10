const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

mongoose
  .connect(
    "mongodb+srv://sahujipriyanshu2112_db_user:Priyanshu123@cluster0.srclyqf.mongodb.net/homelxy?retryWrites=true&w=majority"
  )
  .then(async () => {
    const col = mongoose.connection.db.collection("citymodels");

    // Ensure 2dsphere index
    await col.createIndex({ location: "2dsphere" });
    console.log("2dsphere index created/ensured");

    // Verify data
    const cities = await col.find({}).project({ cityName: 1, location: 1 }).toArray();
    cities.forEach((c) =>
      console.log(c.cityName, "->", JSON.stringify(c.location.coordinates))
    );

    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
