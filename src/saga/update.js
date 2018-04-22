import { takeEvery } from 'redux-saga/effects';
import { generateActionType } from '../utils/action';
// import performRequest from '../utils/request';

function* performUpdateRequest(data) {
  console.log(data);
  // performRequest()
  yield; // dispatch success/error
}

export default function* watchUpdateRequest() {
  const updateRegex = new RegExp(`${generateActionType('update', '(.*)')}`);
  yield takeEvery(
    action => updateRegex.test(action.type),
    performUpdateRequest,
  );
}
