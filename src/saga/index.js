import { all, fork } from 'redux-saga/effects';
import watchReadListRessource from './readlist';

export default function* root() {
  yield all([
    fork(watchReadListRessource),
  ]);
}
