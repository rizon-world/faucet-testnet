require('dotenv').config();

const grpc = require('@grpc/grpc-js');
const { cosmos } = require('./proto.js');

const getRpcRequester = (client, prefix) => (method, requestData, callback) => {
  const name = `/${prefix}/${method.name}`;
  client.makeUnaryRequest(
    name,
    arg => arg,
    arg => arg,
    requestData,
    callback
  )
};

const Client = grpc.makeGenericClientConstructor({});
const client = new Client(
  process.env.RIZON_GRPC_ENDPOINT,
  grpc.credentials.createInsecure(),
);

const txService = new cosmos.tx.v1beta1.Service(getRpcRequester(client, 'cosmos.tx.v1beta1.Service'), false, false);
const authQueryService = new cosmos.auth.v1beta1.Query(getRpcRequester(client, 'cosmos.auth.v1beta1.Query'), false, false);

module.exports = {
  txService,
  authQueryService,
};
