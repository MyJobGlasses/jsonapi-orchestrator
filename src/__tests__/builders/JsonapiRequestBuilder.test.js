import JsonapiRequestBuilder from '../../builders/JsonapiRequestBuilder';
import JsonapiResourceReader from '../../builders/JsonapiResourceReader';

describe('JsonapiRequestBuilder', () => {
  let requestBuilder;
  let resource;

  describe('constructor', () => {
    test('can assign requestBuilder variables during instanciation', () => {
      resource = new JsonapiResourceReader();
      const requestBuilderArguments = {
        path: '/foo/bar',
        method: 'OPTIONS',
        resource,
        params: { id: '42' },
      };
      requestBuilder = new JsonapiRequestBuilder(requestBuilderArguments);
      expect(requestBuilder.path).toEqual('/foo/bar');
      expect(requestBuilder.method).toEqual('OPTIONS');
      expect(requestBuilder.resource).toEqual(resource);
      expect(requestBuilder.params).toEqual(expect.objectContaining({ id: '42' }))
    });
  });

  describe('instance methods', () => {
    describe('#addMeta', () => {
      beforeEach( () => {
        requestBuilder = new JsonapiRequestBuilder({});
      });

      test('merges new meta', () => {
        requestBuilder.addMeta({ invitationToken: '42' });
        requestBuilder.addMeta({ token: 'deadbeef' });

        expect(requestBuilder.meta).toMatchObject({
          invitationToken: '42',
          token: 'deadbeef',
        });
      });
    });

    describe('#action', () => {
      describe('building a read request', () => {
        beforeEach(() => {
          resource = new JsonapiResourceReader({
            jsonapiType: 'conversation', params: { id: 'cafebabe' },
          });
          requestBuilder = new JsonapiRequestBuilder({
            resource, method: 'OPTIONS', path: '/conversations',
          });
        });

        test('returns a correct read action', () => {
          expect(requestBuilder.action()).toMatchObject({
            type: 'READ_CONVERSATION_RESOURCE',
            // params: { id: 'cafebabe' },
            meta: {},
          });
        });
      });
    });
  });
});

