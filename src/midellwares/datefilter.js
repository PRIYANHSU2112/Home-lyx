
exports.date = async(req,res,next)=>{
    let  filter = req.query.filter
    const filters = {
        today: {
          $gte: new Date().setHours(0, 0, 0),
          $lte: new Date().setHours(23, 59, 59),
        },
        week: {
          $gte: new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay())
          ),
          $lte: new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay() + 6)
          ),
        },
        month: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
        year: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
          $lte: new Date(new Date().getFullYear(), 11, 31),
        },
        total: { $lte: new Date() },
      };
    
      if (filter === "manually") {
        // console.log("djfidji")
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        if (!req.query.startDate || !req.query.endDate) {
          console.log("fudfud")
          return res.status(400).json({
            success: false,
            message: "Please provide startDate and endDate parameters.",
          });
        }
        
        filters.manually = {
          $gte: new Date(startDate).setHours(0, 0, 0),
          $lte: new Date(endDate).setHours(23, 59, 59),
        };
      }
      if (filter) {
        if (
          filter != "today" &&
          filter != "week" &&
          filter != "month" &&
          filter != "year" &&
          filter != "total" &&
          filter != "manually"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "'today', 'week', 'month', 'year', 'total', 'manually' are the valid filter options.",
          });
        } 
      }
    //   console.log(filters[filter])
      req.filterQuery = filters[filter];
      next()
}