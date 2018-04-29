let mainConnector = null;

/**
 * @todo handle if we want to overwrite mainConnector
 */
export default class JsonApiConnector {
  constructor(params) {
    this.url = params.url;
    mainConnector = mainConnector || this;
  }

  static connector() {
    if (!mainConnector) {
      return new JsonApiConnector();
    }
    return mainConnector;
  }

  buildEndpoint(path) {
    return `${this.url}/${path}`;
  }
}

export const getMainConnector = JsonApiConnector.connector;
