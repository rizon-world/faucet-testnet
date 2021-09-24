require('dotenv').config();

const _ = require('lodash');
const BigJs = require('big.js');
const rizonSigner = require('./rizon-signer');
const { txService } = require('./rizon-grpc-service');
const rizonProtoTxService = require('./rizon-proto-tx-service');
const AMOUNT = Number(process.env.AMOUNT) || 0;

function send (toAddress) {
  const fromAddress = rizonSigner.getAddress();
  const amount = new BigJs(AMOUNT).toFixed(0);
  const txBody = rizonProtoTxService.createMsgSendTxBody(fromAddress, toAddress, amount, 'faucet');
  return rizonProtoTxService.createTxRequest({ txBody, feeAmount: 500 })
    .then((txRequest) => txService.broadcastTx(txRequest));
}

module.exports = {
  send,
};
