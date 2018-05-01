import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import JsonApiConnector from '../../JsonApiConnector';
import performRequest from '../../utils/request';
import watchReadListRessource from '../../saga/readlist';

describe('#readlist', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-new
    new JsonApiConnector({
      url: 'http://127.0.0.1/api/v1',
    });
    window.fetch = jest.fn(() => Promise.resolve({ status: 200 }));
  });

  test('can properly perform request when action', () => expectSaga(watchReadListRessource)
    .dispatch({
      type: '@@api/READ_LIST_RESOURCE_MONSTER_BEAR_REQUEST',
      resourceUri: 'monster/bear',
      requestData: {
        type: 'monster/bear',
      },
    })
    .provide([
      [matchers.call.fn(performRequest), {}],
    ])
    .put.like({
      action: {
        type: '@@api/READ_LIST_RESOURCE_MONSTER_BEAR_SUCCESS',
      },
    })
    .silentRun());
});
