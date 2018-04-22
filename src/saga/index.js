import { all, fork } from 'redux-saga/effects';
import watchUpdateRequest from './update';

export default function* root() {
  yield all([
    fork(watchUpdateRequest),
  ]);
}
