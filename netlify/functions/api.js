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

// FonePay API configuration
const fonepayConfig = {
  pid: process.env.FONEPAY_PID || 'NBQM',
  secretKey: process.env.FONEPAY_SECRET_KEY || 'a7e3512f5032480a83137793cb2021dc',
  fonepayUrl: process.env.FONEPAY_URL || 'https://dev-clientapi.fonepay.com/api/merchantRequest',
  returnUrl: process.env.RETURN_URL || '/.netlify/functions/api/verify-payment',
};

// Helper function to generate PRN
function generatePRN() {
  return uuidv4();
}

// Helper function to format date as MM/DD/YYYY
function getFormattedDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Helper function to create HMAC SHA-512 hash for payment request
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

  console.log('Payment Request DV Input:', {
    params,
    stringToHash,
    secretKey: fonepayConfig.secretKey
  });

  const dv = crypto
    .createHmac('sha512', fonepayConfig.secretKey)
    .update(stringToHash)
    .digest('hex')
    .toUpperCase();

  console.log('Payment Request DV Output:', dv);
  return dv;
}

// Helper function to create HMAC SHA-512 hash for verification
function generateVerificationDV(params) {
  // Get the keys from the received response, excluding DV and RU
  const receivedKeys = Object.keys(params).filter(key => key !== 'DV' && key !== 'RU');
  console.log('Received keys from FonePay:', receivedKeys);

  // Create string to hash using only the received keys
  const stringToHash = receivedKeys
    .map(key => params[key] || '')
    .join(',');

  console.log('Verification DV Input:', {
    receivedParams: params,
    receivedKeys: receivedKeys,
    stringToHash
  });

  const dv = crypto
    .createHmac('sha512', fonepayConfig.secretKey)
    .update(stringToHash)
    .digest('hex')
    .toUpperCase();

  console.log('Verification DV Output:', dv);
  return dv;
}

// Routes
router.post("/request-payment", async (req, res) => {
  try {
    console.log('Received payment request:', req.body);
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
    
    console.log('Redirecting to:', paymentUrl);
    res.redirect(paymentUrl);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/verify-payment', (req, res) => {
  console.log('1. Received verification request with query params:', req.query);
  
  try {
    const params = { ...req.query };
    const { DV, PS, RC, PRN, P_AMT } = params;
    delete params.DV;
    delete params.RU;

    const calculatedDV = generateVerificationDV(params);
    console.log('3. DV Comparison:', {
      receivedDV: DV,
      calculatedDV: calculatedDV,
      match: calculatedDV === DV
    });

    if (calculatedDV === DV) {
      console.log('4. DV validation successful');
      
      // Log payment details
      console.log('Payment Details:', {
        PRN,
        Status: PS,
        ResponseCode: RC,
        Amount: P_AMT,
        BankCode: params.BC,
        UserID: params.UID
      });

      if (PS === 'true' && RC === 'successful') {
        console.log('5. Payment successful');
        res.redirect('/payment-success.html');
      } else {
        console.log('5. Payment failed', {
          PaymentStatus: PS,
          ResponseCode: RC,
          Reason: params.RC === 'failed' ? 'Transaction declined' : 'Unknown error'
        });
        res.redirect(`/payment-failed.html?prn=${PRN}&reason=${RC}`);
      }
    } else {
      console.log('4. DV validation failed');
      res.redirect('/payment-error.html?error=validation_failed');
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.redirect('/payment-error.html?error=processing_error');
  }
});

// Use the router
api.use('/.netlify/functions/api', router);

// Export the handler
module.exports.handler = serverless(api);
