// This is how the state would look like
// Assuming you have registered an API "Hermes" with some resources
{
  api: {
    hermes: {
      resource1: {
        jsonapiOrchestrator: { // Metas added by the lib
          lastRequestedAt: '2018-09-09 8:42 +1' // Used for cache expiration
        }
        data: { // Indexe
          cafebabe: {
            id: 'cafebabe',
            attributes: {
              attribute1: xxx
              attribute2: xxx,
              ...
            },
            relationships: {
              hasOneRelationship1: {
                data: {id: xxx, type: xxx}
              }
              hasManyRelationships: {
                data: [ {id: xxx, type: xxx}, {id: xxx, type: xxx}, ...] // Should be ordered ==> forces to have an array (ie a foreign_keys_key)
              },
              ...
            }
          }
        }
      },
      resource2: { ... },
      ...,
      // Indexes are used for READ X RESOURCE LIST that can return polymorphic objects
      indexes: {
        listResource1: {
          [hashOf(filters, queryParams, etc)]: {
            firstRequestedAt: Date // Date of page 1 results
            noMoreResults: Boolean // indicate if end of page reached
            // For pagination, no need we can jjust rely on resultsWithOrder.length ?
            resultsWithOrder: [
            { type: 'resource1', id:, order: 1, debugKey: addedByPostProcessor },
            { type: 'resource2', id:, order: 2, debugKey: addedByPostProcessor }
            // Eventually other stuff from postProcessors
          ]
        }
      }
    }
  }
}