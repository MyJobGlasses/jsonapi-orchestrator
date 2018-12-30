import JsonapiRequestBuilder from '../../builders/JsonapiRequestBuilder';
import JsonapiResourceReader from '../../builders/JsonapiResourceReader';
import JsonapiResourceListReader from '../../builders/JsonapiResourceListReader';
import JsonapiResourceWriter from '../../builders/JsonapiResourceWriter';
import Api from '../../api';

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
            api: new Api({ url: 'https://conversation.example.com' }),
          });
        });

        test('returns a correct read action', () => {
          expect(requestBuilder.asReduxAction()).toMatchObject({
            type: 'READ_CONVERSATION_RESOURCE',
            url: 'https://conversation.example.com/conversations/cafebabe',
            meta: {},
          });
        });

        describe('when the reader requests sideloads and sortings', () => {
          beforeEach(() => {
            resource.sideload({ tags: true })
            resource.sort({ created_at: 'desc' })
          })
          test('contains json:api read relevant get params', () => {
            expect(requestBuilder.asReduxAction()).toMatchObject({
              type: 'READ_CONVERSATION_RESOURCE',
              url: 'https://conversation.example.com/conversations/cafebabe?sort=-created_at&include=tags',
              meta: {},
            });
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

      describe('building a write#create request', () => {
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
          resource = conversationResource;
          conversationResource.sidepost('messages', [messageResource]);
          requestBuilder = new JsonapiRequestBuilder({
            resource: conversationResource,
            path: '/conversations',
          });
        });

        test('returns a correct write redux action', () => {
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

        test('returns correct fetch options', () => {
          const fetchOptions = requestBuilder.fetchOptions()
          fetchOptions.body = JSON.parse(fetchOptions.body)
          expect(fetchOptions).toMatchObject({
            method: 'POST',
            headers: {},
            body: {
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
            },
          });
        });
      });

      describe('building a write#update request', () => {
        beforeEach(() => {
          const conversationResource = new JsonapiResourceWriter({
            id: 'faceb00k',
            jsonapiType: 'conversation',
            params: { userid: 'cafebabe' },
            attributes: {
              recipient: 'deadbeef',
            },
          });
          // Sidepost the Tag
          const tagBuilder = new JsonapiResourceWriter({
            jsonapiType: 'tag',
            id: 'dadbudd',
          });
          conversationResource.disassociate('tags', [tagBuilder]);
          resource = conversationResource;
          requestBuilder = new JsonapiRequestBuilder({
            resource: conversationResource,
            path: '/conversations',
          });
        });

        test('returns a correct write redux action', () => {
          expect(requestBuilder.asReduxAction()).toMatchObject({
            type: 'UPDATE_CONVERSATION_RESOURCE',
            data: {
              id: 'faceb00k',
              type: 'conversation',
              attributes: { recipient: 'deadbeef' },
            },
          });
        });

        test('returns correct fetch options', () => {
          const fetchOptions = requestBuilder.fetchOptions()
          fetchOptions.body = JSON.parse(fetchOptions.body)
          expect(fetchOptions).toMatchObject({
            method: 'PATCH',
            headers: {},
            body: {
              data: {
                id: 'faceb00k',
                type: 'conversation',
                attributes: { recipient: 'deadbeef' },
                relationships: {
                  tags: {
                    data: [{
                      id: 'dadbudd',
                      type: 'tag',
                      method: 'disassociate',
                    }]
                  },
                },
              },
            },
          });
        });
      });
    });
  });
});

