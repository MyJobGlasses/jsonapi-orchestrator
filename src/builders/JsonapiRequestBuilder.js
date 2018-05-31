import { merge } from 'lodash';
import JsonapiResourceReader from './JsonapiResourceReader';
import JsonapiResourceWriter from './JsonapiResourceWriter';

const requestActionType = (typePrefix, jsonapiType) => {
  if (!typePrefix) { throw new Error('You need to set the action type (Create, update, etc.) of your resource !'); }
  if (!jsonapiType) { throw new Error('You need to set the jsonapiType of your resource !'); }
  return `${typePrefix.toUpperCase()}_${jsonapiType.toUpperCase()}_RESOURCE`;
};

export default class JsonapiRequestBuilder {
  constructor({ resource = null, httpMethod = null, path = '', params = {}, api = null, meta = {} }) {
    this.resource = resource;
    this.httpMethod = httpMethod || this.inferHttpMethod();
    this.path = path;
    this.params = params;
    this.api = api;
    this.meta = meta;
  }

  action() {
    this.ensureReadyToPerform();
    return ({
      type: requestActionType(
        this.resource.requestActionTypePrefix,
        this.resource.jsonapiType,
      ),
      meta: this.resource.meta,
      resolve: this.promiseResolve,
      reject: this.promiseReject,
      ...this.resource.specificActionObject(),
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
}