import {
  generateActionTypeSuccess,
  generateActionTypeRequest,
} from './utils/action';

/**
 * Generate an action to dispatch
 * @param {String} method - HTTP method
 * @param {String} resource - Resource type (eg: monster/bear)
 * @param {Object} params - all payload params (eg: attributes, meta...)
 * @param {String} params.url - endpoint on which request resource
 * @param {String} params.type - type of the requested ressource
 */
export const generateAction = (method, resource, params = {}) => {
  if (!('url' in params)) {
    throw new Error('All actions must implement url param');
  }
  return {
    type: generateActionTypeRequest(method, resource),
    requestData: {
      type: resource,
    },
    ...params,
  };
};

  /**
 * Generate a read list action to dispatch
 * @param {String} resource - Resource type (eg: monster/bear)
 * @param {Object} params - all payload params (eg: attributes, meta...)
 * @param {String} params.url - endpoint on which request resource
 * @param {String} params.type - type of the requested ressource
 */
export const generateActionReadList = (resource, params = {}) =>
  generateAction('read_list', resource, params);

/**
 * Generate an action to dispatch
 * @param {String} method - HTTP method
 * @param {String} resource - Resource type (eg: monster/bear)
 * @param {Object} params - all payload params (eg: attributes, meta...)
 * @param {String} params.url - endpoint on which request resource
 * @param {String} params.type - type of the requested ressource
 */
export const generateSuccessAction = (method, resource, payload) => ({
  type: generateActionTypeSuccess(method, resource),
  payload,
});
