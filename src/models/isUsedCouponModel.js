const {mongoose} = require('mongoose')

const couponUsageSchema = new mongoose.Schema({
    couponId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"couponSchema",
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"userModel",
    },
    couponCode:{
       type:String,
    }
}, { timestamps: true })

couponUsageSchema.index(
  { couponId: 1, userId: 1 },
);


module.exports = mongoose.model("couponUsageSchema",couponUsageSchema);