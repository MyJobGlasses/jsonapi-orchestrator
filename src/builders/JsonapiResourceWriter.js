import { merge, flatMap, forOwn } from 'lodash';
import Uuid from 'uuid/v4';

import JsonapiResourceBuilder from './JsonapiResourceBuilder';

export default class JsonapiResourceWriter extends JsonapiResourceBuilder {
  /**
   * @param {Object} args See inherited params from @JsonapiResourceBuilder
   * @param {Object} args.dataMeta - Meta object under data
   * @param {Object} args.attributes - Attributes of the document to be written or updated
   * @param {Object} args.associations - See {@link #associate()}
   * @param {Object} args.disassociations - See {@link #disassociate()}
   * @param {Object} args.sideposts - See {@link #sidepost()}
   */
  constructor(args = {}) {
    super(args);

    const {
      dataMeta = {}, attributes = {},
      associations = {}, disassociations = {}, sideposts = {},
      id = null,
    } = args;

    this.attributes = attributes;
    this.dataMeta = dataMeta;

    this.sideposts = {};
    forOwn(sideposts, (val, key) => this.sidepost(key, val));
    this.associations = {};
    forOwn(associations, (val, key) => this.associate(key, val));
    this.disassociations = {};
    forOwn(disassociations, (val, key) => this.disassociate(key, val));

    if (id) {
      this.id = id;
    } else {
      this.tempid = Uuid();
    }
  }

  /*
   * @return {Object} used for requestisation with redux
   */
  asReduxAction() {
    return ({
      params: this.params,
      data: this.asJsonapiDataJson(),
      included: this.jsonapiJsonForIncluded(),
    });
  }

  /**
   * Return list of options to add to the fetch call
   * @return {Object} body for POST request
   */
  fetchOptions() {
    return ({
      body: JSON.stringify({
        data: this.asJsonapiDataJson(),
        included: this.jsonapiJsonForIncluded(),
      }),
    });
  }

  /**
   * Add attributes to be persisted
   * @param {Object} newAttributes
   */
  addAttributes(newAttributes) {
    merge(this.attributes, newAttributes);
  }

  /**
   **********************
   * Relationship linking
   **********************
   */

  /**
   * @param sidepost {Object<String, Composite>}
   *   - end values must be
   *     - either JsonapiResourceWriters (to-one relationships)
   *     - ... or Array<JsonapiResourceWriters> (to-many relationships)
   *
   * @example
   *
   * const toOneMessageSidepost = new JsonapiResourceWriter(
   *   jsonapiType: 'message', attributes: { text: 'Jsonapi Orchestrator is cool!' }
   * ))
   *
   * feedBackWriter.sidepost('message', toOneMessageSidepost)
   *   # => Will record message for a sideposting #create operation
   *
   */
  sidepost(key, valueOrValues) {
    this._addRelationship(key, valueOrValues, 'create', 'sideposts');
  }

  /**
   * Associates the given resource
   * See {@link #sidepost()}
   */
  associate(key, valueOrValues) {
    this._addRelationship(key, valueOrValues, 'associate', 'associations');
  }

  /**
   * Disassociates the given resource
   * See {@link #sidepost()}
   */
  disassociate(key, valueOrValues) {
    this._addRelationship(key, valueOrValues, 'disassociate', 'disassociations');
  }

  /**
   * @api private
   * @param {String} name          Name of the relationship
   * @param {Object[] or Object} valueOrValues List or single value
   * @param {String} method        Value of the method key
   * @param {[type]} iVarName      Name of iVar holding the related resources
   */
  _addRelationship(name, valueOrValues, method, iVarName) {
    const iVar = this[iVarName];
    if (valueOrValues instanceof Array) {
      valueOrValues.forEach((resource) => { resource.setMethod(method); });
      iVar[name] = (iVar[name] || []).concat(valueOrValues);
    } else {
      valueOrValues.setMethod(method);
      iVar[name] = valueOrValues;
    }
  }

  /**
   ****************************************
   ** Jsonapi JSON resource Representations
   ****************************************
   */

  /**
   * Represent this resource as the main json:api `data` document
   *
   * @return {Object} - Object ready for serialization under .data or .included
   * @return {Object.type}
   * @return {Object.id} - Optional
   * @return {Object.temp-id} - temporary ID created for matching nested objects
   * @return {Object.attributes} - list of attributes
   * @return {Object.relationships} - list of relationships
   * @return {Object.meta} - Metadata associated with the object and this request
   */
  asJsonapiDataJson() {
    return this.addIdOrTempId({
      type: this.jsonapiType,
      attributes: this.attributes,
      relationships: this.jsonapiJsonForDataRelationships(),
      meta: this.dataMeta,
    });
  }

  /**
   * Represent this resource as a json:api `included` document
   *
   * Our Jsonapi relationship serialization is compatible with the sidepost draft
   *   (https://github.com/json-api/json-api/pull/1197)
   *
   * @return {Object} - Object ready for serialization as relationship
   * @return {Object.type}
   * @return {Object.id} - Optional
   * @return {Object.temp-id} - temporary ID created for matching nested objects
   * @return {Object.method} - method used for updating the relationship
   *                           (associate, disassociate, create, update)
   */
  asJsonapiRelationshipJson() {
    return this.addIdOrTempId({
      type: this.jsonapiType,
      method: this.method,
    });
  }

  /**
   * Automatically add a tempid or an id to the payload currently being build
   * @param {Object} payload - Payload updated with a tempid or the id of the resource
   */
  addIdOrTempId(payload) {
    const payloadWithId = { ...payload };
    if (this.inferMethod() === 'create') {
      payloadWithId['temp-id'] = this.tempid;
    } else {
      payloadWithId.id = this.id;
    }
    return payloadWithId;
  }

  /**
   * @api private
   * @return {String}
   */
  requestActionTypePrefix() {
    return this.inferMethod() === 'create' ? 'CREATE' : 'UPDATE';
  }

  httpMethod() {
    return this.inferMethod() === 'create' ? 'POST' : 'PATCH';
  }

  /**
   * Setter for the persistence method
   * (supported by jsonapi_suite: create/update/associate/disassociate)
   * @param {String} method
   */
  setMethod(method) {
    this.method = method;
  }

  /**
   * Automatically infer create or update if the method is not provided
   * based on the presence or absence of the resource ID
   * @return {String}
   */
  inferMethod() {
    if (this.method) {
      return this.method;
    } else if (!this.id) {
      return 'create';
    }
    return 'update';
  }

  /**
   *********************************************
   ** Relationship & Included payload generation
   *********************************************
   */

  /**
   * @return {Object} Object whose keys are all the relationships to be updated whatever the method
   */
  relationshipsIterable() {
    return ({
      ...this.sideposts,
      ...this.associations,
      ...this.disassociations,
    });
  }

  /**
   * @return {Array<Object>} List of resources that should be serialized under the included key
   */
  includedIterable() {
    return this.sideposts;
  }

  /**
   * @return {Object} json:api `data.relationship` object
   */
  jsonapiJsonForDataRelationships() {
    const relationshipsJson = {};
    const iterable = this.relationshipsIterable();
    Object.keys(iterable).forEach((key) => {
      const val = iterable[key];
      if (val instanceof Array) {
        relationshipsJson[key] = {
          data: val.map(singleRelationship => singleRelationship.asJsonapiRelationshipJson()),
        };
      } else {
        relationshipsJson[key] = { data: val.asJsonapiRelationshipJson() };
      }
    });
    return relationshipsJson;
  }

  /**
   * @return {Array<Object>} json:api `included` array of included resources
   */
  jsonapiJsonForIncluded() {
    let included = [];
    const iterable = this.includedIterable();
    Object.keys(iterable).forEach((key) => {
      const val = iterable[key];
      if (val instanceof Array) {
        included = [
          ...included,
          ...val.map(includedResource => includedResource.asJsonapiDataJson()),
          ...flatMap(val, includedResource => includedResource.jsonapiJsonForIncluded()),
        ];
      } else {
        included = [
          ...included,
          val.asJsonapiDataJson(),
          ...val.jsonapiJsonForIncluded(),
        ];
      }
    });
    return included;
  }
}
