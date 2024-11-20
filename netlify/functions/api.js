const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const qs = require('qs');

const api = express();
const router = express.Router();

api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));

// Apply logging middleware
api.use((req, res, next) => {
    const now = new Date();
    console.log(`${now.toISOString()} - Request: ${req.method} ${req.originalUrl}`);
    next();
});

// FonePay API configuration
const fonepayConfig = {
  pid: process.env.FONEPAY_PID || 'NBQM',
  secretKey: process.env.FONEPAY_SECRET_KEY || 'a7e3512f5032480a83137793cb2021dc',
  fonepayUrl: process.env.FONEPAY_URL || 'https://dev-clientapi.fonepay.com/api/merchantRequest',
  returnUrl: 'https://www.mhangsacreation.com/verify-payment',
};

// Helper functions
function generatePRN() {
  return uuidv4();
}

function getFormattedDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function generateDV(params) {
  const stringToHash = [
    params.PID,
    params.MD,
    params.PRN,
    params.AMT,
    params.CRN,
    params.DT,
    params.R1,
    params.R2,
    params.RU,
  ].join(',');

  return crypto
    .createHmac('sha512', fonepayConfig.secretKey)
    .update(stringToHash)
    .digest('hex')
    .toUpperCase();
}

// Root route for direct payment flow
router.get("/", async (req, res) => {
  console.log('Root route hit, initiating payment...');
  try {
    const remarks = req.query.remarks || "Default remarks"; // Use query parameter or default
    const prn = generatePRN();
    const params = {
      PID: fonepayConfig.pid,
      MD: 'P',
      PRN: prn,
      AMT: 1000,
      CRN: 'NPR',
      DT: getFormattedDate(),
      R1: remarks+": From Mhangsa Creation",  // Use the remarks from query parameter
      R2: "paid from website",
      RU: fonepayConfig.returnUrl,
    };

    params.DV = generateDV(params);
    const paymentUrl = `${fonepayConfig.fonepayUrl}?${qs.stringify(params)}`;
    
    console.log('Generated FonePay URL:', paymentUrl);
    return res.redirect(paymentUrl);

  } catch (error) {
    console.error('Error:', error);
    return res.redirect('/payment-error.html');
  }
});

// Mount the router
api.use('/', router);

// Export the handler
module.exports.handler = serverless(api);
