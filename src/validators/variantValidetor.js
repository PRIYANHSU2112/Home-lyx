exports.validateVariants = (variants) => {
    if (!Array.isArray(variants) || variants.length === 0) {
        return "At least one variant is required";
    }

    const sizes = new Set();


    for (let i = 0; i < variants.length; i++) {

    const v = variants[i];
    const mrp = Number(v.mrp);
    const stock = Number(v.stock);
    const discount = v.discount !== undefined ? Number(v.discount) : 0;

    if(!v.size){
        return 'size must be requried'
    }

    if (isNaN(mrp) || mrp <= 0) {
      return `Variant ${v.size}: mrp must be greater than 0`;
    }

    if (isNaN(stock) || stock < 0) {
      return `Variant ${v.size}: stock must be 0 or more`;
    }

    if (isNaN(discount) || discount < 0 || discount > 100) {
      return `Variant ${v.size}: discount must be between 0 and 100`;
    }
  

    }
    return null;
}