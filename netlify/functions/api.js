const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const qs = require('qs');

const api = express();

// Middleware
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));

// FonePay API configuration
const fonepayConfig = {
  pid: process.env.FONEPAY_PID || 'NBQM',
  secretKey: process.env.FONEPAY_SECRET_KEY || 'a7e3512f5032480a83137793cb2021dc',
  fonepayUrl: process.env.FONEPAY_URL || 'https://dev-clientapi.fonepay.com/api/merchantRequest',
  returnUrl: process.env.RETURN_URL || '/api/verify-payment',
};

// Helper functions remain the same...
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

function generateVerificationDV(params) {
  const receivedKeys = Object.keys(params).filter(key => key !== 'DV' && key !== 'RU');
  const stringToHash = receivedKeys
    .map(key => params[key] || '')
    .join(',');

  return crypto
    .createHmac('sha512', fonepayConfig.secretKey)
    .update(stringToHash)
    .digest('hex')
    .toUpperCase();
}

// Request Payment - Keep the working version
api.post("/request-payment", async (req, res) => {
  try {
    const { amount, r1, r2 } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const prn = generatePRN();
    const params = {
      PID: fonepayConfig.pid,
      MD: 'P',
      PRN: prn,
      AMT: amount,
      CRN: 'NPR',
      DT: getFormattedDate(),
      R1: r1 || 'Payment for product',
      R2: r2 || 'No additional info',
      RU: fonepayConfig.returnUrl,
    };

    params.DV = generateDV(params);
    const paymentUrl = `${fonepayConfig.fonepayUrl}?${qs.stringify(params)}`;
    
    console.log('Redirecting to FonePay:', paymentUrl);
    return res.redirect(paymentUrl);

  } catch (error) {
    console.error('Error in payment request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment request',
      error: error.message
    });
  }
});

// Verify Payment with improved error handling
api.get("/verify-payment", (req, res) => {
  console.log('1. Received verification request with query params:', req.query);
  
  try {
    const params = { ...req.query };
    const { DV, PS, RC, PRN, P_AMT } = params;
    delete params.DV;
    delete params.RU;

    const calculatedDV = generateVerificationDV(params);
    console.log('2. DV Comparison:', {
      receivedDV: DV,
      calculatedDV: calculatedDV,
      match: calculatedDV === DV
    });

    if (calculatedDV === DV) {
      console.log('3. DV validation successful');
      
      console.log('4. Payment Details:', {
        PRN,
        Status: PS,
        ResponseCode: RC,
        Amount: P_AMT
      });

      if (PS === 'true' && RC === 'successful') {
        return res.redirect('/payment-success.html');
      } else {
        return res.redirect(`/payment-failed.html?prn=${PRN}&reason=${RC}`);
      }
    } else {
      console.log('3. DV validation failed');
      return res.redirect('/payment-error.html?error=validation_failed');
    }
  } catch (error) {
    console.error('Verification Error:', error);
    return res.redirect('/payment-error.html?error=processing_error');
  }
});

// Add root route to handle automatic payment flow
api.get("/", async (req, res) => {
  console.log('Root route hit, initiating payment...');
  try {
    const prn = generatePRN();
    const params = {
      PID: fonepayConfig.pid,
      MD: 'P',
      PRN: prn,
      AMT: 1000, // Default amount
      CRN: 'NPR',
      DT: getFormattedDate(),
      R1: "mhangsa tech gauley",
      R2: "paid from website",
      RU: fonepayConfig.returnUrl,
    };

    params.DV = generateDV(params);
    const paymentUrl = `${fonepayConfig.fonepayUrl}?${qs.stringify(params)}`;
    
    console.log('Generated FonePay URL:', paymentUrl);
    return res.redirect(paymentUrl);

  } catch (error) {
    console.error('Error initiating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});

// Export the handler
module.exports.handler = serverless(api);
