const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const qs = require('qs');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const api = express();
const router = express.Router();

api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));
const API_KEY = 'AIzaSyDAsCYNjw3M1q-a07ICsi1eehz99ZZEOQs';  

// FonePay API configuration
const fonepayConfig = {
  pid: process.env.FONEPAY_PID || 'NBQM',
  secretKey: process.env.FONEPAY_SECRET_KEY || 'a7e3512f5032480a83137793cb2021dc',
  fonepayUrl: process.env.FONEPAY_URL || 'https://dev-clientapi.fonepay.com/api/merchantRequest',
};

// Google Sheets setup
const sheets = google.sheets({version: 'v4', auth: API_KEY});

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
    const returnUrl = `${req.protocol}://${req.get('host')}/payment-complete.html`; // Dynamically set the returnUrl
    const params = {
      PID: fonepayConfig.pid,
      MD: 'P',
      PRN: prn,
      AMT: 10,
      CRN: 'NPR',
      DT: getFormattedDate(),
      R1: remarks,  // Use the remarks from query parameter
      R2: "paid from website",
      RU: returnUrl,
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

// New route to handle adding a row

// Mount the router
api.use('/', router);
api.use(cors());  // Enable CORS for all routes

api.get("/payment-complete", (req, res) => {
    const filePath = path.join(__dirname, '..', 'public', 'payment-complete.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            return res.status(500).send('Error loading the page');
        }
        // Replace placeholder with actual environment variable
        const updatedData = data.replace('`${window.location.origin}`', process.env.HOMEPAGE_LINK || 'https://ashimshakya.itch.io/gauley');
        res.send(updatedData);
    });
});

// Export the handler
module.exports.handler = serverless(api);
