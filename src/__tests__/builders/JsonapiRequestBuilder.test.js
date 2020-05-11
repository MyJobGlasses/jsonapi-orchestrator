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
          params: { 
            id: 'cafebabe', 
            lost: '4,8,15,16,23 ând\' 42', 
          },
        });
      });

      test('replaces params appropriately, URL encodes them, and transform commas in values', () => {
        expect(requestBuilder.compileUrl())
          .toBe('conversations/cafebabe?lost=4%2C8%2C15%2C16%2C23+%C3%A2nd%27+42');
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

        test('returns a correct redux read action', () => {
          expect(requestBuilder.asReduxAction()).toMatchObject({
            type: 'READ_CONVERSATION_RESOURCE',
            url: 'https://conversation.example.com/conversations/cafebabe',
            meta: {},
          });
        });

        test('returns correct read fetch options', () => {
          expect(requestBuilder.fetchOptions()).toMatchObject({
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.api+json',
            },
          });
        });

        describe('when the reader requests sideloads, sortings and filters, with special chars', () => {
          beforeEach(() => {
            resource.sideload({ tags: true })
            resource.sort({ created_at: 'desc' })
            resource.filter({ location: '42.12N,12.42W', specialchars: 'Pésky lîttle chârs' })
          })
          test('contains json:api read relevant get params', () => {
            expect(requestBuilder.asReduxAction()).toMatchObject({
              type: 'READ_CONVERSATION_RESOURCE',
              url: 'https://conversation.example.com/conversations/cafebabe?sort=-created_at&include=tags&filter%5Blocation%5D=42.12N%252C12.42W&filter%5Bspecialchars%5D=P%C3%A9sky+l%C3%AEttle+ch%C3%A2rs',
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
            headers: {
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json',
            },
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
