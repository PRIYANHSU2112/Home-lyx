const mongoose = require('mongoose');

try {
  require('../src/models/ecommerce/productModel');
  console.log('productModel loaded OK');
  require('../src/models/ecommerce/categoryModel');
  console.log('ecommerce categoryModel loaded OK');
  require('../src/models/ecommerce/orderModel');
  console.log('ecommerce orderModel loaded OK');
} catch (err) {
  console.error('Error loading models:', err);
  process.exit(1);
}