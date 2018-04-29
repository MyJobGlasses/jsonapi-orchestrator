import { generateActionTypeSuccess } from './utils/action';

const defaultState = {};

export default (state = defaultState, action) => {
  const successRegex = new RegExp(`${generateActionTypeSuccess('read_list', '(.*)')}`);
  if (successRegex.test(action.type)) {
    // @todo modify next line to handle deep merge
    return Object.assign({}, state, action.payload);
  }

  return state;
};
