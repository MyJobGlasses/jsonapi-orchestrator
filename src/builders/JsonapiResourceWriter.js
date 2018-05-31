import { merge, mergeWith, isEmpty, isArray, flatMap, forOwn } from 'lodash';
import Uuid from 'uuid/v4';

import JsonapiResourceBuilder from './JsonapiResourceBuilder';

const concatNestedArrayCustomizer = (a, b) => {
  if (isArray(a)) {
    return a.concat(b);
  };
};

/* eslint-disable no-param-reassign */
const addRelationship = (name, valueOrValues, method, iVar) => {
  if (valueOrValues instanceof Array) {
    valueOrValues.forEach( (resource) => { resource.method = method; });
    iVar[name] = (iVar[name] || []).concat(valueOrValues);
  } else {
    valueOrValues.method = method;
    iVar[name] = valueOrValues;
  }
};
/* eslint-enable no-param-reassign */

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

  /**
   ****************************************
   ** Relationship linking
   ****************************************
   */

  /* @param sidepost {Object<String, Composite>}
   *   - end values must be
   *     - either JsonapiResourceWriters (toOne relationships)
   *     - ... or Array<JsonapiResourceWriters> (toMany)
   *
   * @example sidepost('message', new JsonapiResourceWriter(
   *   jsonapiType: 'message', attributes: { text: 'Hello World!' }
   * ))
   *   # => Will record message for sidepost#create
   *
   */
  sidepost(key, valueOrValues) {
    addRelationship(key, valueOrValues, 'create', this.sideposts);
  }

  associate(key, valueOrValues) {
    addRelationship(key, valueOrValues, 'associate', this.associations);
  }

  disassociate(key, valueOrValues) {
    addRelationship(key, valueOrValues, 'disassociate', this.disassociations);
  }


  /**
   ****************************************
   ** Jsonapi JSON resource Representations
   ****************************************
   */

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
    const payloadWithId = { ...payload };
    if (this.inferMethod() === 'create') {
      payloadWithId['temp-id'] = this.tempid;
    } else {
      payloadWithId.id = this.id;
    }
    return payloadWithId;
  }

  /* @api private */
  get requestActionTypePrefix() {
    return this.inferMethod() === 'create' ? 'CREATE' : 'UPDATE';
  }

  inferMethod() {
    if (this.method) {
      return this.method;
    }
    else if (!this.id) {
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
    return mergeWith(
      {}, this.sideposts, this.associations, this.disassociations,
      concatNestedArrayCustomizer,
    );
  }

  includedIterable() {
    return mergeWith({},
      this.sideposts,
      concatNestedArrayCustomizer
    );
  }

  jsonapiJsonForDataRelationships() {
    const relationshipsJson = {};
    const iterable = this.relationshipsIterable()
    Object.keys(iterable).forEach((key) => {
      const val = iterable[key];
      if (val instanceof Array) {
        relationshipsJson[key] = { data: val.map( singleRelationship => singleRelationship.asJsonapiRelationshipJson()) };
      } else {
        relationshipsJson[key] = { data: val.asJsonapiRelationshipJson() };
      }
    });
    return relationshipsJson;
  }

  jsonapiJsonForIncluded() {
    const included = [];
    const iterable = this.includedIterable()
    Object.keys(iterable).forEach((key) => {
      const val = iterable[key];
      if (val instanceof Array) {
        merge(included, val.map( includedResource => includedResource.asJsonapiDataJson()));
        merge(included, flatMap(val, includedResource => includedResource.jsonapiJsonForIncluded()));
      } else {
        included.push(val.asJsonapiDataJson());
        merge(included, val.jsonapiJsonForIncluded());
      }
    });
    return included;
  }
}