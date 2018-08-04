import { merge } from 'lodash';
import JsonapiResourceReader from './JsonapiResourceReader';
import JsonapiResourceWriter from './JsonapiResourceWriter';

import { requestActionType, mergeParamsInUrlPlaceholdersAndParams } from '../utils/builders';

export default class JsonapiRequestBuilder {
  constructor({
    resource = null, httpMethod = null, path = '', params = {}, api = null, meta = {},
  }) {
    this.resource = resource;
    this.httpMethod = httpMethod || this.inferHttpMethod();
    this.path = path;
    this.params = params;
    this.api = api;
    this.meta = meta;
  }

  asReduxAction() {
    if (!this.resource) { throw new Error('This request needs a resource') }
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

  addPromiseHandlers(resolve, reject) {
    this.promiseResolve = resolve;
    this.promiseReject = reject;
  }

  /* merges additional request meta */
  addMeta(meta) { this.meta = merge(this.meta, meta); }

  inferHttpMethod() {
    if (this.resource instanceof JsonapiResourceWriter) {
      return this.resource.method === 'update' ? 'PATCH' : 'POST';
    } else if (this.resource instanceof JsonapiResourceReader) {
      return 'GET';
    }
    return undefined;
  }

  ensureReadyToPerform() {
    if (!this.resource) { throw new Error('You need to supply a resource builder'); }
    if (!this.path) { throw new Error('Supply a path for the resource'); }
    if (!this.httpMethod || !this.inferHttpMethod) { throw new Error('HTTP Method cannot be inferred, please supply it'); }
  }

  /* Return a compiled URL with placeholders replaced and params merged
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
      return this.api.url + mergeParamsInUrlPlaceholdersAndParams(this.path, this.params);
    }
    return mergeParamsInUrlPlaceholdersAndParams(this.path, this.params);
  }
}
