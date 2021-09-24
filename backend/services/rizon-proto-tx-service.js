require('dotenv').config();

const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const { google, cosmos, rizonworld } = require('./proto.js');
const rizonSigner = require('./rizon-signer');
const rizonAuthQueryService = require('./rizon-auth-query-service');

const CHAIN_ID = process.env.RIZON_CHAIN_ID;

function createMsgSendTxBody (fromAddress, toAddress, amount, memo = '') {
  const sendMessage = new cosmos.bank.v1beta1.MsgSend({
    from_address: fromAddress,
    to_address: toAddress,
    amount: [{
      amount,
      denom: 'uatolo',
    }],
  });

  const sendMessageAny = new google.protobuf.Any({
		type_url: '/cosmos.bank.v1beta1.MsgSend',
		value:  cosmos.bank.v1beta1.MsgSend.encode(sendMessage).finish()
	});

  return new cosmos.tx.v1beta1.TxBody({ messages: [sendMessageAny], memo });
}

function createAuthInfo (sequence, feeAmount, gasLimit) {
  const signerInfo = new cosmos.tx.v1beta1.SignerInfo({
		public_key: new google.protobuf.Any({
      type_url: '/cosmos.crypto.secp256k1.PubKey',
      value: rizonSigner.getPublicKey(),
    }),
		mode_info: { single: { mode: cosmos.tx.signing.v1beta1.SignMode.SIGN_MODE_DIRECT } },
		sequence: Number(sequence)
	});

	const feeValue = new cosmos.tx.v1beta1.Fee({
		amount: [{ denom: 'uatolo', amount: String(feeAmount) }],
		gas_limit: Number(gasLimit),
	});

	return new cosmos.tx.v1beta1.AuthInfo({ signer_infos: [signerInfo], fee: feeValue });
}

function createSignDoc (chainId, txBody, authInfo, accountNumber) {
  const bodyBytes = cosmos.tx.v1beta1.TxBody.encode(txBody).finish();
  const authInfoBytes = cosmos.tx.v1beta1.AuthInfo.encode(authInfo).finish();
  const signDoc = new cosmos.tx.v1beta1.SignDoc({
    chain_id: chainId,
    body_bytes: bodyBytes,
    auth_info_bytes: authInfoBytes,
    account_number: Number(accountNumber)
  });
  return signDoc;
}

function createTxRawBytes (txBody, authInfo, signature) {
  const txBodyBytes = cosmos.tx.v1beta1.TxBody.encode(txBody).finish();
  const authInfoBytes = cosmos.tx.v1beta1.AuthInfo.encode(authInfo).finish();
  const txRaw = new cosmos.tx.v1beta1.TxRaw({
    body_bytes: txBodyBytes,
    auth_info_bytes: authInfoBytes,
    signatures: [signature.signature],
  });
  return cosmos.tx.v1beta1.TxRaw.encode(txRaw).finish();
}

async function createTxRequest ({
  txBody,
  feeAmount,
  gasLimit = 200000,
  broadcastMode = cosmos.tx.v1beta1.BroadcastMode.BROADCAST_MODE_ASYNC,
}) {
  const { account_number, sequence } = await rizonAuthQueryService.getAccount(rizonSigner.getAddress());
  const authInfo = createAuthInfo(sequence, feeAmount, gasLimit);
  const signDoc = createSignDoc(CHAIN_ID, txBody, authInfo, account_number);
  const signature = rizonSigner.sign(signDoc);
  const txRawBytes = createTxRawBytes(txBody, authInfo, signature);
  return { tx_bytes: txRawBytes, mode: broadcastMode };
}

module.exports = {
  createMsgSendTxBody,
  createTxRequest,
};
