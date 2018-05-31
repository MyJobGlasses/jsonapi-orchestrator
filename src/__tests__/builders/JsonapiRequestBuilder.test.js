import JsonapiRequestBuilder from '../../builders/JsonapiRequestBuilder';
import JsonapiResourceReader from '../../builders/JsonapiResourceReader';
import JsonapiResourceWriter from '../../builders/JsonapiResourceWriter';

describe('JsonapiRequestBuilder', () => {
  let requestBuilder;
  let resource;

  describe('constructor', () => {
    test('can assign requestBuilder variables during instanciation', () => {
      resource = new JsonapiResourceReader();
      const requestBuilderArguments = {
        path: '/foo/bar',
        httpMethod: 'OPTIONS',
        resource,
        params: { id: '42' },
      };
      requestBuilder = new JsonapiRequestBuilder(requestBuilderArguments);
      expect(requestBuilder.path).toEqual('/foo/bar');
      expect(requestBuilder.httpMethod).toEqual('OPTIONS');
      expect(requestBuilder.resource).toEqual(resource);
      expect(requestBuilder.params).toEqual(expect.objectContaining({ id: '42' }));
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

      describe('building a write request', () => {
        beforeEach(() => {
          const conversationResource = new JsonapiResourceWriter({
            jsonapiType: 'conversation',
            params: { id: 'cafebabe' },
            attributes: {
              recipient: 'deadbeef',
            },
          });
          const messageResource = new JsonapiResourceWriter({
            jsonapiType: 'message',
            attributes: {
              text: 'Hello world !',
              clientId: '0ff1ce',
            },
          });
          conversationResource.sidepost({ messages: [messageResource] });
          requestBuilder = new JsonapiRequestBuilder({
            resource: conversationResource, method: 'OPTIONS', path: '/conversations',
          });
        });

        test.skip('returns a correct write action', () => {
          expect(requestBuilder.action()).toMatchObject({
            type: 'CREATE_CONVERSATION_RESOURCE',
            data: {
              type: 'conversation',
              attributes: { recipient: 'deadbeef' },
              relationships: {
                messages: [{
                  type: 'message',
                  method: 'create',
                  'temp-id': expect.any(String),
                }],
              },
            },
            included: [{
              type: 'message',
              'temp-id': expect.any(String),
              data: {
                attributes: {
                  text: 'Hello world !',
                  clientId: '0ff1ce',
                },
              },
            }],
          });
        });
      });
    });
  });
});

