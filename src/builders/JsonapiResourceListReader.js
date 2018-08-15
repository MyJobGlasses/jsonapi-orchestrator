import JsonapiResourceReader from './JsonapiResourceReader';

export default class JsonapiResourceListReader extends JsonapiResourceReader {
  constructor(args = {}) {
    super(args);
  }

  /**
   * @override
   */
  // eslint-disable-next-line class-methods-use-this
  requestActionTypePrefix() {
    return 'READ_LIST';
  }
}
