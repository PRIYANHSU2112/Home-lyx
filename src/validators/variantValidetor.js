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

        if (!v.size) {
            return 'size is required for all variants';
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

        if (sizes.has(v.size)) {
            return `Duplicate size: ${v.size}`;
        }
        sizes.add(v.size);
    }
    return null;
};

// Validate variant sizes against category's predefined sizes
exports.validateVariantSizesAgainstCategory = (variants, categorySizes) => {
    if (!Array.isArray(categorySizes) || categorySizes.length === 0) {
        return "Category must have predefined sizes";
    }

    const categoryAllowedSizes = new Set(categorySizes.map(s => String(s).trim()));

    for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!categoryAllowedSizes.has(String(variant.size).trim())) {
            return `Size "${variant.size}" is not allowed for this category. Allowed sizes: ${categorySizes.join(", ")}`;
        }
    }
  }
    return null;