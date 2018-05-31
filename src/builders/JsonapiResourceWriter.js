import { merge, mergeWith, isEmpty, isArray } from 'lodash';
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
    this.sideposts = sideposts;
    this.associations = associations;
    this.disassociations = disassociations;
    this.dataMeta = dataMeta;
    this.tempid = Uuid();
  }

  /*
   * @return {Object} used for requestisation
   */
  specificActionObject() {
    return ({
      params: this.params,
      data: this.asJsonapiDataJson(),
      included: this.jsonapiJsonForIncluded(),
    });
  }

  addAttributes(newAttributes) {
    merge(this.attributes, newAttributes)
  }

  /* @param sidepost {Object<String, Composite>}
   *   - end values must be JsonapiResourceWriters
   *
   * @example sidepost({ message: new JsonapiResourceWriter(jsonapiType: 'message', attributes: { text: 'Hello World!' }))
   *   # => Will record message for sidepost#create
   *
   */
  sidepost(newSidepost) {
    mergeWith(this.sideposts, newSidepost, (a, b) => {
      if (isArray(a)) {
        return a.concat(b);
      };
    });
  }

  associate(newAssociation) {
    mergeWith(this.associations, newAssociation, (a, b) => {
      if (isArray(a)) {
        return a.concat(b);
      };
    });
  }

  disassociate(newDisassociation) {
    mergeWith(this.disassociations, newDisassociation, (a, b) => {
      if (isArray(a)) {
        return a.concat(b);
      };
    });
  }

  /** private **/

  /** Jsonapi JSON resource Representations **/

  asJsonapiDataJson() {
    return this.addIdOrTempId({
      type: this.jsonapiType,
      attributes: this.attributes,
      relationships: this.jsonapiJsonForDataRelationships(),
      meta: this.dataMeta,
    });
  }

  /*
   * @return {Object} - Object ready for serialization as relationship
   * @return {Object.type}
   * @return {Object.id} - Optional
   * @return {Object.temp-id} - temporary ID created for matching nested objects
   * @return {Object.method}
   *
   */
  asJsonapiRelationshipJson() {
    return this.addIdOrTempId({
      type: this.jsonapiType,
      method: this.method,
    });

  }

  addIdOrTempId(payload) {
    const payloadWithId = { ...payload }
    if (this.method === 'create') {
      payloadWithId['temp-id'] = this.tempid;
    } else {
      payloadWithId.id = this.id
    }
    return payloadWithId;
  }

  /* @api private */
  get requestActionTypePrefix() {
    return this.method === 'create' ? 'CREATE' : 'UPDATE';
  }

  /**
   **********************************
   ** Relationship payload generation
   **********************************
   */

  relationshipsIterable() {
    return { ...this.sideposts, ...this.associations, ...this.disassociations };
  }

  jsonapiJsonForDataRelationships() {
    const relationships = {};
    Object.keys(this.relationshipsIterable).forEach((key, val) => {
      if (val instanceof Array) {
        relationships[key] = { data: val.map( singleRelationship => singleRelationship.asJsonapiRelationshipJson()) };
      } else {
        relationships[key] = { data: val.asJsonapiRelationshipJson() };
      }
    });
    return relationships;
  }

  jsonapiJsonForIncluded() {
    const included = [];
    Object.keys(this.relationshipsIterable).forEach((key, val) => {
      if (val instanceof Array) {
        included.concat(val.map( includedResource => includedResource.asJsonapiDataJson()));
        included.concat(val.flatMap( includedResource => includedResource.jsonapiJsonForIncluded()));
      } else {
        included.push(val.asJsonapiDataJson());
        included.concat(val.jsonapiJsonForIncluded());
      }
    });
    return included;
  }
}