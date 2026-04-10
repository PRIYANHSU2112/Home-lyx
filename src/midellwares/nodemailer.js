const nodemailer = require("nodemailer");
const http = require("http");
const commpany = require("../models/commpanyModel");
// exports.sendMailOTP = async (email, contant) => {
//   const transporter = nodemailer.createTransport({
//     host: "mail.jdomni.in",
//     secure: true,
//     secureConnection: false,
//     tls: {
//       ciphers: "SSLv3",
//     },
//     requireTLS: true,
//     port: 465,
//     debug: true,
//     auth: {
//       user: "info@essindiaonline.in",
//       pass: "justdial",
//     },
//   });

//   // async..await is not allowed in global scope, must use a wrapper
//   async function main() {
//     // send mail with defined transport object
//     const info = await transporter.sendMail({
//       from: '"info@essindiaonline.in" <info@essindiaonline.in>', // sender address
//       to: email, // list of receivers
//       subject: "WellCome to Essindiaonline", // Subject line
//       text: `${contant}`, // plain text body
//       html: `<b>${contant}</b>`, // html body
//     });

//     console.log("Message sent: %s", info.messageId);
//   }
//   main().catch(console.error);
// };

exports.sendMailOTP = async (
  email,
  contant
) => {
  let commpanyData = await commpany.findOne();
  const transporter = nodemailer.createTransport({
    host: "mail.jdomni.in",
    port: 465,
    secure: true, // use SSL
    auth: {
      user: "info@essindiaonline.in",
      pass: "justdial",
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${contant}</title>
        <style>
            body {
                background-color: #f0f0f0;
                font-family: Arial, sans-serif;
            }
            .email-container {
                border-radius: 10px;
                margin: auto;
                color: white;
                max-width: 500px;
                border: 1px solid #a13942;
                background: linear-gradient(to bottom, #a13942, #600053);
                text-align: center;
            }
            .email-container img {
                width: 100px;
                padding: 10px;
            }
            .email-container .check-img {
                width: 100px;
                border-radius: 50%;
            }
            .email-container h1 {
                margin: 0;
                padding-top: 7px;
            }
            .email-container p {
                margin: 0;
            }
            .email-container .contact-info {
                padding: 10px 20px;
            }
        </style>
    </head>
    <body>
        <table class="email-container">
            <tr>
                <td style="text-align: left; padding: 10px;">
                    <img src="https://sgp1.digitaloceanspaces.com/${commpanyData?.fav_icon}" alt="LOGO">
                </td>
            </tr>
            <tr>
                <td style="text-align: center; padding: 20px;">
                    <img src="https://sgp1.digitaloceanspaces.com/HomeService/1716455475058WhatsApp%20Image%202024-05-23%20at%2012.37.07_cb3272de.jpg" alt="LOGO" class="check-img">
                    <h1>${contant}!</h1>
                </td>
            </tr>
            <tr>
                <td class="contact-info" style="text-align: center;">
                    <p>📳 <strong>+91 ${commpanyData?.phone}</strong></p>
                </td>
            </tr>
            <tr>
                <td class="contact-info" style="text-align: center; padding-bottom: 50px;">
                    <p>✉️ <strong>${commpanyData?.email}</strong></p>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;

  // Wrapping the main function to use async/await
  async function main() {
    try {
      const info = await transporter.sendMail({
        from: '"info@essindiaonline.in" <info@essindiaonline.in>', // sender address
        to: email, // list of receivers
        subject: "Welcome to Essindiaonline", // Subject line
        text: `Thank you`, // plain text body
        html: htmlContent, // html body
      });

      console.log("Message sent: %s", info.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  main();
};

exports.sendOtpFunction = (mobile, contant) => {
  const options = {
    method: "POST",
    hostname: "api.msg91.com",
    port: null,
    path: "/api/v5/flow/",
    headers: {
      authkey: "384292AwWekgBJSf635f77feP1",
      "content-type": "application/json",
    },
  };

  const req = http.request(options, function (res) {
    const chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      const body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });

  req.write(
    `{\n  \"flow_id\": \"63614b3dabf10640e61fa856\",\n  \"sender\": \"Home Service\",\n  \"mobiles\": \"91${mobile}\",\n  \"Order\": \"${contant}\"\n}`
  );
  req.end();
};
