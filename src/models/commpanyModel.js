const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    site_name: {
      type: String,
      default: "company name",
    },
    loader: {
      type: String,
      default:
        "HomeService/1690967242433loader.gif",
    },
    fav_icon: {
      type: String,
      default:
        "HomeService/1690967242421logo.png",
    },
    refund_Policy: {
      type: String,
      default: "<h1>refund_Policy</h1>"
    },
    shippingAndDelivery: {
      type: String,
      default: "<h1>shippingAndDelivery</h1>"
    },
    header_logo: {
      type: String,
      default:
        "HomeService/1690967242421logo.png",
    },
    signatory: {
      type: String,
      default:
        "HomeService/1690967242421logo.png",
    },
    footer_logo: {
      type: String,
      default:
        "HomeService/1690967242421logo.png",
    },
     ONBOARDING_DATA: [
      {
        title: {
          type: String,
        },
        subtitle: {
          type: String,
        },
        color: {
          type: String,
        },
        image: {
          type: String,
        },
      },
    ],

footer_description: {
  type: String,
      default:
  "© 2021 Satya Kabir E-solutions Private Limited. All Rights Reserved.",
    },
footer_about: {
  type: String,
      default:
  "<p>Web Design &amp; Development Company in Bhopal # We are a well-established Software Development Company located in Bhopal(Lake-city).</p>",
    },
address: {
  type: String,
      default: "footer description",
    },
gst: {
  type: String,
      default: "23BGJPG1783L1Z8",
    },
email: {
  type: String,
      default: "company@gmail.com",
    },
phone: {
  type: Number,
      default: 98989889,
    },
phone1: {
  type: Number,
      default: 98989889,
    },
facebook: {
  type: String,
      default: "www.company.com",
    },
googleMyBusiness: {
  type: String,
      default: "www.google.com",
    },
pinterest: {
  type: String,
      default: "www.pinterest.com",
    },
instagram: {
  type: String,
      default: "www.company.com",
    },
linkedin: {
  type: String,
      default: "www.company.com",
    },
twitter: {
  type: String,
      default: "www.company.com",
    },
youtube: {
  type: String,
      default: "www.company.com",
    },
whastapp: {
  type: String,
      default: "5656565656",
    },
map: {
  lang: {
    type: Number,
        default: 98.989889,
      },
  long: {
    type: Number,
        default: 98.989889,
      },
},
banner: {
  type: String,
      default:
  "HomeService/16909672422921615375782838-f890f8 1.png",
    },
description: {
  type: String,
      default: "<h1> description</h1>",
    },
seo_keyword: {
  type: String,
      default: "company,name ,new",
    },
seo_description: {
  type: String,
      default: "<h1>seo description</h1>",
    },
term_condition: {
  type: String,
      default: "<h1>term_condition </h1>",
    },
privacy_policy: {
  type: String,
      default: "<h1>privacy_policy </h1>",
    },
return_policy: {
  type: String,
      default: "<h1>return_policy </h1>",
    },
about_us: {
  type: String,
      default: "<h1>about_us </h1>",
    },
theme_color: {
  type: String,
      default: "#ff34fe",
    },
font_Style: {
  type: String,
      default:
  "'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif",
    },
header_link: {
  type: Array,
      default: ["home", "about", "contact", "shop"],
    },
productDeliveryFee: {
  type: Number,
      default: 0,
    },
    adminCharge: {
      type: Number,
      default: 0,
    },
minDelAmount: {
  type: Number,
      default: 0,
    },
footer_link: {
  type: Array,
      default: [
    "home",
    "about",
    "contact",
    "shop",
    "terms & Condition",
    "Privacy policy",
    "return policy",
  ],
    },
playstoreLink: {
  type: String,
      default: "www",
    }
  },
{ timestamps: true }
);

module.exports = mongoose.model("companyModel", companySchema);
