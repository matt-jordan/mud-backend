import assert from 'power-assert';

import defaultErrorHandler from '../../../src/api/middleware/defaultErrorHandler.js';

describe('defaultErrorHandler', () => {

  it('sets the res object status to 500', () => {
    const testError = new Error('Foo');
    const mockResponse = {
      statusCode: 0,
      body: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(body) {
        this.body = body;
        return this;
      },
    };

    defaultErrorHandler(testError, null, mockResponse, () => {});
    assert(mockResponse.statusCode === 500);
    assert(mockResponse.body);
  });

});