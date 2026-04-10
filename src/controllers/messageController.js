const messageModel = require("../models/messageModel");
const threadModel = require("../models/threadModel");
const userModel = require("../models/userModel");
const { io, server } = require("../../index");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const notificationModel = require("../models/notificationModel");

const sendNotificationToAdminWhenNewMessageOnSameDay = async (adminId,userId,thread) => {
  try{
    const startOfToday = new Date();

    startOfToday.setHours(0, 0, 0, 0);

    // console.log(startOfToday,"feafdg")

    const todaysFirstMessage = await messageModel.find({createdAt: { $gte: startOfToday},from : userId}).sort({ createdAt: 1 })

    console.log(todaysFirstMessage,"dsat")

    if(todaysFirstMessage.length==1){

      const getUser = await userModel.findById({ _id: userId });

      const notification = await notificationModel.create({
        title : "Chat",
        message : `${getUser?.fullName} Wants To Chat With You`,
        icon : getUser?.image,
        date : new Date(),
        userId : adminId,
        chatUserId:getUser._id,
        threadId:thread,
        userType : "SUPER_ADMIN",
        // type : ""

      })
      console.log(notification,"king")
    }

  }catch{
    console.log(error.message)
  }
}

exports.createMessage = async (req, res) => {
  // console.log("DDJDJDDJDJ",req.body)
  try {
    let { from, message, userType, messageType } = req.body;

    let to = new ObjectId("64ddafdb7f21b2c8878e17d5");

    let image = req.file ? req.file.key : null;

    let thread = await threadModel.findOne({
      userId: { $in: [from] },
      userType: userType,
    });

    if (!thread) {
      thread = await threadModel.create({
        userId: [from, to],
        userType: userType,
      });
    }

    let obj = {
      from: from,
      to: to,
      message: message,
      threadId: thread?._id,
      image: image,
      userType: userType,
      messageType: messageType,
    };

    io.emit(`newMessage/${thread?._id}`, obj);
    io.emit(`threaId/${thread?._id}`, thread?._id);

    const dataCreate = await messageModel.create(obj);
    sendNotificationToAdminWhenNewMessageOnSameDay(to,from,thread?._id)
    return res.status(200).json({
      success: true,
      message: "chart create successfully",
      data: dataCreate,
    });

  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getChatFromThreadId = async (req, res) => {
  try {
    const threadId = req.params.threadId;

    const getAllChat = await messageModel
      .find({ threadId: threadId })
      .populate("to", "fullName image phoneNumber");

    if (!getAllChat.length) {
      throw {
        status: 404,
        message: "Your Chat History Is Empty",
        data: [],
      };
    }

    return res.status(200).json({
      success: true,
      message: "Your Chat History Fetched Successfully",
      data: getAllChat,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message, data: error?.data });
  }
};

exports.getYourThreadId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userType = req.query.userType;
    let from = userId;
    let thread = await threadModel.findOne({
      userId: { $in: from },
      userType: userType,
    });
    return res.status(200).json({
      success: true,
      message: "Your Thread Id Is Fatch",
      data: thread,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.getAllChatByAdmin = async (req, res) => {
//   try {
//     let thread = await threadModel
//       .find({
//         userId: { $in: "64ddafdb7f21b2c8878e17d5" },
//       })
//       .populate("userId", "fullName image phoneNumber");
//     return res.status(200).json({
//       success: true,
//       message: "get ALL Chat",
//       data: thread,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.getAllChatByAdmin = async (req, res) => {
  try {
    const searchKey = req.query.searchKey || "";

    let thread = await threadModel
      .find({
        userId: { $in: "64ddafdb7f21b2c8878e17d5" },
      })
      .populate("userId", "fullName image phoneNumber")
      .sort({ createdAt: -1 }); // Sort by creation date in descending order
      const filterData = (data, key) => {
        // Check if the key is a number
        const isNumber = /^\d+$/.test(key);
      
        return data.filter(entry =>
          entry.userId.some(user =>
            isNumber 
              ? user.phoneNumber === Number(key) 
              : new RegExp(key, 'i').test(user.fullName)
          )
        );
      };
      
      
    const filteredData = filterData(thread, searchKey);
    return res.status(200).json({
      success: true,
      message: "get ALL Chat", 
      data: filteredData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

