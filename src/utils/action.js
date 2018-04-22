/**
 * Generate an action string for run request
 * All theses kind of actions will be catched by saga to perform request
 * @param {String} method - Will be uppercased for the action
 * @param {String} resource - Will be underscored and uppercased
 * @example generateActionType('update', 'blog/article') =
 *  '@@api/UPDATE_RESOURCE_BLOG_ARTICLE';
 */
export const generateActionType = (method, resource) => `@@api/${method.toUpperCase()}_RESOURCE_${resource.replace('/', '_').toUpperCase()}`;

/**
 * Action type dispatched on request perform with success
 * @param {String} method - Will be uppercased for the action
 * @param {String} resource - Will be underscored and uppercased
 * @example generateActionType('update', 'blog/article') =
 *  '@@api/UPDATE_RESOURCE_BLOG_ARTICLE_SUCCESS';
 */
export const generateActionTypeSuccess = (method, resource) => `${generateActionType(method, resource)}_SUCCESS`;

/**
 *
 * @param {String} method - Will be uppercased for the action
 * @param {String} resource - Will be underscored and uppercased
 * @example generateActionType('update', 'blog/article') =
 *  '@@api/UPDATE_RESOURCE_BLOG_ARTICLE_ERROR';
 */
export const generateActionTypeError = (method, resource) => `${generateActionType(method, resource)}_ERROR`;
