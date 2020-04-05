export default class JsonapiResourceBuilder {
  /**
   * @param  {String} options.jsonapiType - json:api document type
   * @param  {Object} options.meta - Meta relevant for json:api orchestrator
   * @param  {Object} params - Additional params relevant to the resource
   */
  constructor({ jsonapiType = null, meta = {}, params = {} }) {
    this.jsonapiType = jsonapiType;
    this.params = params;
    this.meta = meta;
  }

  /**
   * Override this method if the resource builder should add params to the URL
   * @return {Object}
   */
  urlParams() {
    return {};
  }
}
