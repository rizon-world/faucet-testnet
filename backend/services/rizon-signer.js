const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const secp256k1 = require('secp256k1');
const bip39 = require('bip39');
const bip32 = require('bip32');
const { bech32 } = require('bech32');
const { google, cosmos } = require('./proto.js');

const PREFIX = process.env.RIZON_PREFIX;
const privateKey = createPrivateKey(process.env.RIZON_FAUCET_MNEMONIC, process.env.RIZON_HD_PATH);
const publicKey = createPublicKey(privateKey);
const address = generateAddress(process.env.RIZON_FAUCET_MNEMONIC, process.env.RIZON_HD_PATH, PREFIX);


function createPrivateKey (mnemonic, hdPath) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bip32.fromSeed(seed);
  const child = node.derivePath(hdPath);
  return child.privateKey;
}

function createPublicKey (privateKey) {
  const pubKeyByte = secp256k1.publicKeyCreate(privateKey);
  var buf1 = new Buffer.from([10]);
  var buf2 = new Buffer.from([pubKeyByte.length]);
  var buf3 = new Buffer.from(pubKeyByte);
  return Buffer.concat([buf1, buf2, buf3]);
}

function generateAddress (mnemonic, hdPath, prefix, checkSum = true) {
  if (typeof mnemonic !== 'string') {
      throw new Error('mnemonic expects a string')
  }
  if (checkSum) {
    if (!bip39.validateMnemonic(mnemonic)) throw new Error("mnemonic phrases have invalid checksums");
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bip32.fromSeed(seed)
  const child = node.derivePath(hdPath)
  const words = bech32.toWords(child.identifier);
  return bech32.encode(prefix, words);
}

function sign (signDoc) {
  const signDocBytes = cosmos.tx.v1beta1.SignDoc.encode(signDoc).finish();
  const hash = crypto.createHash('sha256').update(signDocBytes).digest();
  return secp256k1.ecdsaSign(hash, Buffer.from(privateKey));
}

function getAddress () {
  return address;
}

function getPublicKey () {
  return publicKey;
}

module.exports = {
  sign,
  getAddress,
  getPublicKey,
};
