const orderModel = require("../../models/ecommerce/orderModel");

/**
 * Fetch top 10 best selling products based on total sales and recent performance.
 * Logic incorporates a score based on last 30 days sold (3x weight) and total sold (1x weight).
 */
exports.getBestSellers = async (req, res) => {
  try {
    const bestSeller = await orderModel.aggregate([
      {
        $match: {
          status: "ORDERED"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $group: {
          _id: "$product.productId",
          totalSold: { $sum: "$product.quantity" },
          last30DaysSold: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    {
                      $dateSubtract: {
                        startDate: "$$NOW",
                        unit: "day",
                        amount: 30
                      }
                    }
                  ]
                },
                "$product.quantity",
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          bestSellerScore: {
            $add: [
              { $multiply: ["$last30DaysSold", 3] },
              { $multiply: ["$totalSold", 1] }
            ]
          }
        }
      },
      { $sort: { bestSellerScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "ecommerceproductmodels",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 0,
          productId: "$productDetails._id",
          title: "$productDetails.title",
          brandName: "$productDetails.brandName",
          rating: "$productDetails.reviewRating",
          variant: {
            $arrayElemAt: ["$productDetails.variants", 0]
          },
          features: "$productDetails.features",
          images: "$productDetails.images",
          thumnail: "$productDetails.thumnail",
          slug: "$productDetails.slug",
          bestSellerScore: 1,
          totalSold: 1,
          last30DaysSold: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: "Best Sellers fetched successfully",
      data: bestSeller
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
