export default class Api {
  constructor({ name = null, url }) {
    this._name = name;
    this._url = url;
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
}
