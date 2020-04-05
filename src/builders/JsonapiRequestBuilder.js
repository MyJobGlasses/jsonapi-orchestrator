import { merge } from 'lodash';
import JsonapiResourceReader from './JsonapiResourceReader';
import JsonapiResourceWriter from './JsonapiResourceWriter';

import { requestActionType, mergeParamsInUrlPlaceholdersAndParams } from '../utils/builders';

export default class JsonapiRequestBuilder {
  /**
   * @param  {Object} params
   * @param  {JsonapiResourceBuilder} params.resource
   * @param  {String} params.httpMethod
   * @param  {String} params.path Path of the request
   * @param  {Object} params.params Extra HTTP params to add ot the generated URL
   * @param  {Api} params.api the API to connect to
   * @param  {Object} params.meta Additional meta to add to the json:api payload
   */
  constructor({
    resource = null,
    httpMethod = null,
    httpHeaders = {},
    path = '',
    params = {},
    api = null,
    meta = {},
  }) {
    this.resource = resource;
    this._httpMethod = httpMethod;
    this._httpHeaders = httpHeaders;
    this.path = path;
    this.params = params;
    this.api = api;
    this.meta = meta;
  }

  /**
   * Returns a dispatchable action for this request
   * Based on the actual resource type, extra fields can be added
   * Like `return.params` or return.
   * Please refer to the corresponding resource#asReduxAction method.
   *
   * @example
   *
   *    resource = new JsonApiResourceWriter({
   *      type: 'user/project',
   *      attributes: { name: 'jsonapi orchestrator' },
   *    })
   *    request = new JsonApiRequestBuilder({
   *      resource: resource,
   *      path: '/users/:id/projects',
   *      params: { id: '00cafebabe'})
   *    })
   *    request.asReduxAction()
   *
   *    # => {
   *      type: CREATE_USER_PROJECT_RESOURCE,
   *      url: '/users/00cafebabe/projects',
   *      meta: {},
   *      resolve: null,
   *      reject: null,
   *      # Start of resource.asReduxAction() keys
   *      params: {},
   *      data: {
   *        type: 'user/project'
   *        attributes: {
   *          name: 'Jsonapi orchestrator'
   *        },
   *        relationships: {},
   *        meta: {}
   *      },
   *      incuded: {}
   *    }
   *
   * @return {Object}
   * @return {Object} return[Object.keys(...resource.asReduxAction)]
   * @return {String} return.type
   * @return {String} return.url relative path of request or (if API provided) full URL
   * @return {Object} return.meta optional meta
   * @return {function} Promise resolve callback
   * @return {function} Promise reject callback
   */
  asReduxAction() {
    if (!this.resource) {
      throw new Error('This request needs a resource');
    }
    this.ensureReadyToPerform();
    return ({
      type: requestActionType(
        this.resource.requestActionTypePrefix(),
        this.resource.jsonapiType,
      ),
      url: this.compileUrl(),
      meta: this.resource.meta,
      resolve: this.promiseResolve,
      reject: this.promiseReject,
      ...this.resource.asReduxAction(),
    });
  }

  /**
   * Attaches a Promise to this request, that can be reused later
   * (for example when dispatching the action)
   *
   * @param {Function} resolve
   * @param {Function} reject
   */
  addPromiseHandlers(resolve, reject) {
    this.promiseResolve = resolve;
    this.promiseReject = reject;
  }

  /**
   * Merge additional request metas
   * @param {Object} meta
   */
  addMeta(meta) {
    this.meta = merge(this.meta, meta);
  }

  /**
   * @return {String} supplied or inferred httpMethod
   */
  get httpMethod() {
    return this._httpMethod || this.inferHttpMethod();
  }

  /**
   * @param {String} httpMethod, capital case
   */
  set httpMethod(httpMethod) {
    this._httpMethod = httpMethod;
  }

  /**
   * @return {String} supplied or inferred httpMethod
   */
  get httpHeaders() {
    return this._httpHeaders;
  }

  /**
   * @param {String} httpMethod, capital case
   */
  set httpHeaders(httpHeaders) {
    this._httpHeaders = httpHeaders;
  }

  /**
   * Infer the HTTP Method for this request, based on the supplied resource
   *
   * @return {String}
   */
  inferHttpMethod() {
    if (this.resource instanceof JsonapiResourceWriter) {
      return this.resource.httpMethod();
    } else if (this.resource instanceof JsonapiResourceReader) {
      return 'GET';
    }
    return undefined;
  }

  /**
   * Explain what is missing to properly fire the request
   * @throws {Error} throws various errors
   */
  ensureReadyToPerform() {
    if (!this.resource) { throw new Error('You need to supply a resource builder'); }
    if (!this.path) { throw new Error('Supply a path for the resource'); }
    if (!this.httpMethod) { throw new Error('HTTP Method cannot be inferred, please supply it'); }
  }

  /**
   * Return a compiled URL with placeholders replaced and params merged
   * Can be used as fetch URL
   * @example
   *
   *   JsonapiRequestBuilder.new(
   *     path: '/conversations/:id?template=mini',
   *     params: {id: 'cafebabe', adminAccess: true},
   *   ).compileUrl()
   *   # => '/conversations/cafebabe?template=mini&adminAccess=true'
   *
   * @return {String} compiled URL
   */
  compileUrl() {
    if (this.api) {
      return this.api.url + mergeParamsInUrlPlaceholdersAndParams(this.path, this.urlParams());
    }
    return mergeParamsInUrlPlaceholdersAndParams(this.path, this.urlParams());
  }

  /**
   * @return {Object} List of URL parameters
   */
  urlParams() {
    if (this.resource) {
      return { ...this.params, ...this.resource.urlParams() }
    } else {
      return this.params
    }
  }

  /**
   * Return
   * @return {Object}
   */
  fetchOptions() {
    return ({
      method: this.httpMethod,
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        ...(this.api ? this.api.headers : {}),
        ...this.httpHeaders,
      },
      ...this.resource.fetchOptions(),
    });
  }
}
