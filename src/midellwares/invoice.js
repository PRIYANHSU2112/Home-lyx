const companyModels = require("../models/commpanyModel");
const { generateAndSaveInvoice } = require("../midellwares/pdfGenerator");
const userModel = require("../models/userModel");

/**
 * Build structured item rows from the order's product array
 */
const buildItems = (order) => {
  const items = [];
  let totalQuantity = 0;

  order?.product?.forEach((item) => {
    const qty = item?.quantity || 0;
    const price = item?.price || 0;
    const taxPercent = item?.taxPersent || 0;

    const taxableValue = price * qty;
    const taxAmount = Math.ceil((taxableValue * taxPercent) / 100);
    const total = taxableValue + taxAmount;

    totalQuantity += qty;

    const row = {
      title: item?.productId?.title || "---",
      qty,
      gross: taxableValue,
      discount: order?.totalOfferDiscount || 0,
      taxable: taxableValue,
      total,
    };

    // CGST/SGST vs IGST based on checkState
    if (order?.checkState) {
      row.cgst = Math.ceil(taxAmount / 2);
      row.sgst = Math.ceil(taxAmount / 2);
    } else {
      row.igst = taxAmount;
    }

    items.push(row);
  });

  return { items, totalQuantity };
};


/**
 * Strip HTML tags from a string (company fields may contain HTML from the DB)
 */
const stripHtml = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).replace(/<[^>]*>/g, "").trim();
};


exports.invoice = async (order) => {

  const company = await companyModels.findOne();
  const user = await userModel.findById(order.customerId);

  const { items, totalQuantity } = buildItems(order);

  const code = "invoice_" + Date.now();

  const fullAddress = [
    order?.address?.address,
    order?.address?.city,
    order?.address?.state,
    order?.address?.pinCode ? `(${order.address.pinCode})` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const invoiceData = {
    soldBy: stripHtml(company?.site_name) || "Company Name",
    gstin: stripHtml(company?.gst) || "",
    phone: stripHtml(company?.phone) || "",
    email: stripHtml(company?.email) || "",
    shipFromAddress: stripHtml(company?.address) || "",

    invoiceNumber: code,
    orderId: String(order._id),
    orderDate: new Date(order.createdAt).toLocaleDateString("en-IN"),
    invoiceDate: new Date().toLocaleDateString("en-IN"),

    billTo: {
      name: user?.fullName || "Customer",
      address: fullAddress,
      phone: String(user?.phoneNumber || ""),
    },
    shipTo: {
      name: user?.fullName || "Customer",
      address: fullAddress,
      phone: String(user?.phoneNumber || ""),
    },

    checkState: order?.checkState || false,
    items,
    grandTotal: order.orderTotal,

    terms: [
      "Goods once sold will not be taken back.",
      "Payment within 7 days from invoice date.",
      "Interest @18% p.a. applicable on delayed payment.",
      "Subject to jurisdiction.",
    ],
  };

  await generateAndSaveInvoice({ data: invoiceData, code });

  return code;
};
