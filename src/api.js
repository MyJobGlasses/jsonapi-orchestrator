export default class Api {
  constructor({ name = null, url }) {
    this._name = name;
    this._url = url;
  }

  get url() { return this._url; }
  set url(url) { this._url = url; }
  get name() { return this._url; }
  set name(name) { this._name = name; }
};
