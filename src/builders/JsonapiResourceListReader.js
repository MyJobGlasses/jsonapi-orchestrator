import JsonapiResourceReader from './JsonapiResourceReader';

export default class JsonapiResourceListReader extends JsonapiResourceReader {
  constructor(args = {}) {
    super(args);
  }

  requestActionTypePrefix() {
    return 'READ_LIST';
  }
}
