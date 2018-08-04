import { merge, flatMap, forOwn } from 'lodash';
import Uuid from 'uuid/v4';

import JsonapiResourceBuilder from './JsonapiResourceBuilder';

export default class JsonapiResourceWriter extends JsonapiResourceBuilder {
  constructor(args = {}) {
    super(args);

    const {
      dataMeta = {}, attributes = {},
      associations = {}, disassociations = {}, sideposts = {},
    } = args;

    this.attributes = attributes;
    this.sideposts = {};
    forOwn(sideposts, (val, key) => this.sidepost(key, val));
    this.associations = {};
    forOwn(associations, (val, key) => this.associate(key, val));
    this.disassociations = {};
    forOwn(disassociations, (val, key) => this.disassociate(key, val));
    this.dataMeta = dataMeta;
    this.tempid = Uuid();
  }

  /*
   * @return {Object} used for requestisation
   */
  asReduxAction() {
    return ({
      params: this.params,
      data: this.asJsonapiDataJson(),
      included: this.jsonapiJsonForIncluded(),
    });
  }

  addAttributes(newAttributes) {
    merge(this.attributes, newAttributes);
  }

  /**
   ****************************************
   ** Relationship linking
   ****************************************
   */

  /* @param sidepost {Object<String, Composite>}
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
   *   # => Will record message for sidepost#create
   *
   */
  sidepost(key, valueOrValues) {
    this._addRelationship(key, valueOrValues, 'create', 'sideposts');
  }

  associate(key, valueOrValues) {
    this._addRelationship(key, valueOrValues, 'associate', 'associations');
  }

  disassociate(key, valueOrValues) {
    this._addRelationship(key, valueOrValues, 'disassociate', 'disassociations');
  }

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

  /*
   * @return {Object} - Object ready for serialization under .data or .included
   * @return {Object.type}
   * @return {Object.id} - Optional
   * @return {Object.temp-id} - temporary ID created for matching nested objects
   * @return {Object.attributes} - list of attributes
   * @return {Object.relationships} - list of relationships
   * @return {Object.meta} - Metadata associated with the object and this request
   *
   */
  asJsonapiDataJson() {
    return this.addIdOrTempId({
      type: this.jsonapiType,
      attributes: this.attributes,
      relationships: this.jsonapiJsonForDataRelationships(),
      meta: this.dataMeta,
    });
  }

  /* Our Jsonapi relationship serialization is compatible with the sidepost draft
   *   (https://github.com/json-api/json-api/pull/1197)
   *
   * @return {Object} - Object ready for serialization as relationship
   * @return {Object.type}
   * @return {Object.id} - Optional
   * @return {Object.temp-id} - temporary ID created for matching nested objects
   * @return {Object.method} - method used for updating the relationship
   *                           (associate, disassociate, create, update)
   *
   */
  asJsonapiRelationshipJson() {
    return this.addIdOrTempId({
      type: this.jsonapiType,
      method: this.method,
    });
  }

  addIdOrTempId(payload) {
    const payloadWithId = { ...payload };
    if (this.inferMethod() === 'create') {
      payloadWithId['temp-id'] = this.tempid;
    } else {
      payloadWithId.id = this.id;
    }
    return payloadWithId;
  }

  /* @api private */
  requestActionTypePrefix() {
    return this.inferMethod() === 'create' ? 'CREATE' : 'UPDATE';
  }

  setMethod(method) {
    this.method = method;
  }

  inferMethod() {
    if (this.method) {
      return this.method;
    } else if (!this.id) {
      return 'create';
    }
    return 'update';
  }

  /**
   **********************************
   ** Relationship payload generation
   **********************************
   */

  relationshipsIterable() {
    return ({
      ...this.sideposts,
      ...this.associations,
      ...this.disassociations,
    });
  }

  includedIterable() {
    return this.sideposts;
  }

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

  jsonapiJsonForIncluded() {
    const included = [];
    const iterable = this.includedIterable();
    Object.keys(iterable).forEach((key) => {
      const val = iterable[key];
      if (val instanceof Array) {
        merge(included, val.map(includedResource => includedResource.asJsonapiDataJson()));
        merge(
          included,
          flatMap(val, includedResource => includedResource.jsonapiJsonForIncluded()),
        );
      } else {
        included.push(val.asJsonapiDataJson());
        merge(included, val.jsonapiJsonForIncluded());
      }
    });
    return included;
  }
}
