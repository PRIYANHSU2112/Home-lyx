

const crypto = require("crypto")
// ========================== Get Id =================================== ||


function generateUniqueWord() {
  return crypto.randomBytes(1).toString("hex"); // e.g., "a1b2c3"
}


exports.generateTransactionId = (slug,title) => {
  let uniqueWord = generateUniqueWord()
  return `${slug}-${uniqueWord}-${title ? title.toLowerCase().replace(/\s+/g, '-') : ''}`;
};


exports.generateCategorySlug = (prefix,name,prefix1, name2) =>{
  const uniqueWord = generateUniqueWord();

  let slugBase = `${name || ""}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")         
    .replace(/[^a-z0-9\-]/g, "");
   let slugBase1 = `${name2 || ""}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")         
    .replace(/[^a-z0-9\-]/g, "");
  return `${prefix}-${slugBase}-${uniqueWord}-${prefix1}-${slugBase1}`;
}















// async function updateAllSlugsAndAddFields() {
//   try {
//     // 1. First get all product IDs and titles (minimal data transfer)
//     const products = await testpreparationModel.find({}, { _id: 1, testName: 1 }).lean().exec();
    
//     // 2. Prepare bulk operations (faster than individual updates)
//     const bulkOps = products.map(product => ({
//       updateOne: {
//         filter: { _id: product._id },
//         update: { 
//           $set: { 
//             slug: generateTransactionId("testpreparation", product.testName?.toString()?.toLocaleLowerCase()), // Your slug generation function                 // Add new field
//           }
//         }
//       }
//     }));

//     // 3. Execute bulk write (much faster than individual updates)
//     const result = await testpreparationModel.bulkWrite(bulkOps);

//     return {
//       success: true,
//       updatedCount: result.modifiedCount,
//       // time: ⁠ ${Date.now() - start}ms ⁠
//     };
//   } catch (err) {
//     console.error('Bulk update failed:', err);
//     return { success: false, error: err.message };
//   }
// }


// // Execute (with timing)
// (async () => {
//   const start = Date.now();
//   const result = await updateAllSlugsAndAddFields();
//   console.log(`Updated ${result.updatedCount} products in ${result.time}`);
// })();