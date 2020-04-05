export default class Api {
  constructor({ name = null, url, headers = {} }) {
    this._name = name;
    this._url = url;
    this._headers = headers;
  }

  /*
   * Get or Set the base URL for APIs.
   * The URL will be prefixed in various places
   * If the URL is left empty, only relative paths will be generated
   *
   * @param {String}
   */
  set url(url) { this._url = url; }

  /**
   * @return {String}
   */
  get url() { return this._url; }

  /**
   * Set a friendly name for this API. Will be more convenient when debugging
   *
   * @param {String}
   */
  set name(name) { this._name = name; }

  /**
   * @return {String}
   */
  get name() { return this._name; }

  /**
   * Set extra headers API. For instance, { 'X-User-Token': 'xxx' }
   *
   * @param {Object}
   */
  set headers(headers) { this._headers = headers; }

  /**
   * @return {Object}
   */
  get headers() { return this._headers; }
}
