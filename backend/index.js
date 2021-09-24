require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const moment = require('moment');
const faucetService = require('./services/faucet-service');
const { default: axios } = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const history = {};
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const INTERVAL = Number(process.env.INTERVAL) || 0;

function isValidAddress (address) {
  return _.startsWith(address, 'rizon') && _.size(address) === 44;
}

function validateTimestamp (address) {
  if (history[address]) {
    const lastTimestamp = moment.unix(history[address]).unix();
    const currentTimestamp = moment().unix();
    return lastTimestamp + INTERVAL <= currentTimestamp;
  }
  return true;
}

async function validateCaptcha (captchaResponse) {
  try {
    const data = `secret=${RECAPTCHA_SECRET}&response=${captchaResponse}`;
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    };
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', data, config);
    const captchaResult = _.get(response, 'data', {});
    return captchaResult.success === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

app.get('/', function (req, res) {
  res.json(JSON.stringify(history));
});

app.post('/faucets', async function (req, res) {
  try {
    const toAddress = _.get(req, 'body.address');

    if (!isValidAddress(toAddress)) {
      res.status(400);
      res.json({ error: 'Invalid address' });
      return;
    }

    if (!validateTimestamp(toAddress)) {
      res.status(400);
      res.json({ error: 'Only one faucet is allowed per a day' });
      return
    }

    const captchaResponse = _.get(req, 'body.captchaResponse');
    const captchaValidation = await validateCaptcha(captchaResponse);
    if (!captchaValidation) {
      res.status(400);
      res.json({ error: 'Invalid captcha response' });
      return
    }

    faucetService.send(toAddress)
      .then((result) => {
        const currentTimestamp = moment().unix();
        history[toAddress] = currentTimestamp;
        const txHash = _.get(result, 'tx_response.txhash');
        res.json({ txHash });
      }).catch((error) => {
        console.error(error);
        res.status(500);
        res.send({ error: error.message });
      })
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send('Internal Server Error');
  }
});

app.listen(process.env.API_PORT);
