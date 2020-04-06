// Inherits all of ResourceReader stuff
// Only ActionTypePrefix changes, and this will be tested at the request level

import JsonapiResourceListReader from '../../builders/JsonapiResourceListReader';

describe('JsonapiResourceListReader', () => {
  describe('constructor', () => {
    test('can assign most parameters', () => {
      const freshness = new Date();
      const instance = new JsonapiResourceListReader({
        jsonapiType: 'conversation',
        meta: { type: 'redCarpet' },
        method: 'OPTIONS',
        sideloads: { messages: true },
        sortings: { messages: { created_at: 'asc' } },
        filters: { messages: { acknowledged: [true] } },
        page: { size: 12, number: 3 },
        dataMustBeFresherThan: freshness,
      });

      expect(instance.jsonapiType).toBe('conversation');
      expect(instance.meta).toEqual(expect.objectContaining({ type: 'redCarpet' }));
      expect(instance.sideloads).toEqual(expect.objectContaining({ messages: true }));
      expect(instance.sortings).toEqual(expect.objectContaining({ messages: { created_at: 'asc' } }));
      expect(instance.filters)
        .toEqual(expect.objectContaining({ messages: { acknowledged: [true] } }));
      expect(instance.paginationFilters).toEqual(expect.objectContaining({ size: 12, number: 3 }));
    });
  });
});
