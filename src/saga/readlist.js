import { takeEvery, put, call } from 'redux-saga/effects';
import { generateSuccessAction } from '../actions';
import { generateActionTypeRequest } from '../utils/action';
import performRequest from '../utils/request';

function* performReadListRequest(data) {
  const payload = yield call(performRequest, data.url);
  yield put(generateSuccessAction('read_list', data.requestData.type, payload));
}

export default function* watchReadListRessource() {
  const updateRegex = new RegExp(`${generateActionTypeRequest('read_list', '(.*)')}`);
  yield takeEvery(
    action => updateRegex.test(action.type),
    performReadListRequest,
  );
}
