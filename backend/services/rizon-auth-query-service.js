const _ = require('lodash');
const { authQueryService } = require('./rizon-grpc-service');
const { cosmos } = require('./proto.js');

function getAccount (address) {
  return authQueryService.account({ address })
    .then((response) => {
      const value = _.get(response, 'account.value');
      const _value = cosmos.auth.v1beta1.BaseAccount.decode(value);
      return cosmos.auth.v1beta1.BaseAccount.toObject(_value, { longs: String });
    });
}

module.exports = {
  getAccount,
};
