import { generateActionType } from './utils/action';

/**
 * Generate an action to dispatch
 * @param {String} method - HTTP method
 * @param {String} resource - Resource type (eg: monster/bear)
 * @param {Object} params - all payload params (eg: attributes, meta...)
 */
export const generateAction = (method, resource, params = {}) => ({
  type: generateActionType(method, resource),
  ...params,
});

/**
 * Generate an update action to dispatch
 * @param {String} resource - Resource type (eg: monster/bear)
 * @param {Object} params - all payload params (eg: attributes, meta...)
 */
export const generateActionUpdate = (resource, params = {}) =>
  generateAction('update', resource, params);
