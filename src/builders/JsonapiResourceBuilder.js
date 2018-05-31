import { merge } from 'lodash';

export default class JsonapiResourceBuilder {
  constructor({ jsonapiType = null, meta = {}, params = {} }) {
    this.jsonapiType = jsonapiType;
    this.meta = meta;
    this.params = params;
  }

  /* merges additional resource meta */
  addMeta(meta) { this.meta = merge(this.meta, meta); }
}
