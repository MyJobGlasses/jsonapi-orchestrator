import JsonapiRequestBuilder from '../../builders/JsonapiRequestBuilder';
import JsonapiResourceReader from '../../builders/JsonapiResourceReader';
import JsonapiResourceListReader from '../../builders/JsonapiResourceListReader';
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
      beforeEach(() => {
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

    describe('#compileUrl', () => {
      beforeEach(() => {
        requestBuilder = new JsonapiRequestBuilder({
          path: 'conversations/:id',
          params: { id: 'cafebabe', otherURIParam: 'deadbeef' },
        });
      });

      test('replaces params appropriately', () => {
        expect(requestBuilder.compileUrl())
          .toBe('conversations/cafebabe?otherURIParam=deadbeef');
      });
    });

    describe('#action', () => {
      describe('building a single document read request', () => {
        beforeEach(() => {
          resource = new JsonapiResourceReader({
            jsonapiType: 'conversation',
          });
          requestBuilder = new JsonapiRequestBuilder({
            resource,
            method: 'OPTIONS',
            path: '/conversations/:id',
            params: { id: 'cafebabe' },
          });
        });

        test('returns a correct read action', () => {
          expect(requestBuilder.asReduxAction()).toMatchObject({
            type: 'READ_CONVERSATION_RESOURCE',
            url: '/conversations/cafebabe',
            meta: {},
          });
        });
      });

      describe('building a document collection read request', () => {
        beforeEach(() => {
          resource = new JsonapiResourceListReader({
            jsonapiType: 'conversation',
          });
          requestBuilder = new JsonapiRequestBuilder({
            resource, httpMethod: 'OPTIONS', path: '/conversations',
          });
        });

        test('returns a correct read action', () => {
          expect(requestBuilder.asReduxAction()).toMatchObject({
            type: 'READ_LIST_CONVERSATION_RESOURCE',
            meta: {},
          });
        });
      });

      describe('building a write request', () => {
        beforeEach(() => {
          const conversationResource = new JsonapiResourceWriter({
            jsonapiType: 'conversation',
            params: { userid: 'cafebabe' },
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
          resource = conversationResource
          conversationResource.sidepost('messages', [messageResource]);
          requestBuilder = new JsonapiRequestBuilder({
            resource: conversationResource, path: '/conversations',
          });
        });

        test('returns a correct write action', () => {
          expect(requestBuilder.asReduxAction()).toMatchObject({
            type: 'CREATE_CONVERSATION_RESOURCE',
            data: {
              type: 'conversation',
              attributes: { recipient: 'deadbeef' },
              relationships: {
                messages: {
                  data: [{
                    type: 'message',
                    method: 'create',
                    'temp-id': expect.any(String),
                  }],
                },
              },
            },
            included: [{
              type: 'message',
              'temp-id': expect.any(String),
              attributes: {
                text: 'Hello world !',
                clientId: '0ff1ce',
              },
            }],
          });
        });
      });
    });
  });
});

