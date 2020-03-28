import JsonapiResourceReader from '../../builders/JsonapiResourceReader';

describe('JsonapiResourceReader', () => {
  describe('constructor', () => {
    test('can assign most parameters', () => {
      const freshness = new Date();
      const instance = new JsonapiResourceReader({
        jsonapiType: 'conversation',
        meta: { type: 'redCarpet' },
        method: 'OPTIONS',
        sideloads: { messages: true },
        sortings: { messages: { created_at: 'asc' } },
        filters: { messages: { acknowledged: [true] } },
        page: { size: 10, number: 2 },
        dataMustBeFresherThan: freshness,
      });

      expect(instance.jsonapiType).toBe('conversation');
      expect(instance.meta).toEqual(expect.objectContaining({ type: 'redCarpet' }));
      expect(instance.sideloads).toEqual(expect.objectContaining({ messages: true }));
      expect(instance.sortings).toEqual(expect.objectContaining({ messages: { created_at: 'asc' } }));
      expect(instance.filters)
        .toEqual(expect.objectContaining({ messages: { acknowledged: [true] } }));
      expect(instance.paginationFilters).toEqual(expect.objectContaining({ size: 10, number: 2 }));
    });
  });

  describe('instances', () => {
    let instance;
    beforeEach(() => {
      instance = new JsonapiResourceReader({});
    });

    describe('sorting', () => {
      describe('flattens sortings for request', () => {
        test('merges appropriately nested sortings', () => {
          // ?sort=-educations.school.name
          instance.sort({ educations: { school: { name: 'desc' } } });
          expect(instance.joinedSortings())
            .toBe('-educations.school.name');
        });

        test('concatenates sortings in the order they were defined', () => {
          // ?sort=-positivelikecount,companyname
          instance.sort({ positivelikecount: 'desc' }, { companyname: 'asc' });
          expect(instance.joinedSortings())
            .toBe('-positivelikecount,companyname');
        });
      });
    });

    describe('filtering', () => {
      describe('flattens filters for request', () => {
        test('merges appropriately nested filters', () => {
          // ?filter[companyname]=airfrance,axa]
          instance.filter({ companyname: ['airfrance', 'axa'] });
          expect(instance.mapOfJoinedFilters()).toMatchObject({
            'filter[companyname]': 'airfrance,axa',
          });
        });

        test('handles nested filters', () => {
          // ?filter[company][name]=airfrance,axa]
          instance.filter({ company: { name: ['airfrance', 'axa'] } });
          expect(instance.mapOfJoinedFilters())
            .toEqual(expect.objectContaining({
              'filter[company][name]': 'airfrance,axa',
            }));
        });

        test('handles multiple filters', () => {
          // ?filter[company][name]=airfrance,axa]
          instance.filter({ company: { name: ['air france', 'axa'] } });
          instance.filter({ company: { sector: ['it, digital', 'business'] } });
          expect(instance.mapOfJoinedFilters()).toMatchObject({
            'filter[company][name]': 'air%20france,axa',
            'filter[company][sector]': 'it%2C%20digital,business',
          });
        });
      });
    });

    describe('sideloading', () => {
      describe('flattens sideloads for request', () => {
        test('merges appropriately single nested routes into a single string', () => {
          instance.sideload({ profiles: { user: true } });
          expect(instance.joinedSideloads())
            .toBe('profiles.user');
        });

        test('duplicates forking sideloading routes into multiple strings', () => {
          instance.sideload({ avatar: true, profiles: { user: true } });
          expect(instance.joinedSideloads())
            .toBe('avatar,profiles.user');
        });

        test('merges multiple distinct sideloads', () => {
          instance.sideload({ avatar: true });
          instance.sideload({ profiles: { user: true } });
          expect(instance.joinedSideloads())
            .toBe('avatar,profiles.user');
        });

        test('merges multiple sideloads sharing common path', () => {
          instance.sideload({ profiles: { user: true } });
          instance.sideload({ profiles: { user: { organization: true } } });
          expect(instance.joinedSideloads())
            .toBe('profiles.user.organization');
        });
      });
    });

    describe('pagination', () => {
      describe('adds pagination filters for the request', () => {
        test('handles merging multiple pagination filters', () => {
          instance.page({ size: 100, number: 2 });
          instance.page({ number: 3 });
          expect(instance.mapOfPaginationFilters()).toMatchObject({
            'page[size]': 100,
            'page[number]': 3,
          });
        });
      });
    });

    describe('parameterization', () => {
      test('aggregates all params for a request', () => {
        instance.sideload({ school: true });
        instance.filter({ companyname: ['airfrance', 'axa'] });
        instance.sort({ companyname: 'desc' });
        instance.page({ size: 10, number: 5 });

        expect(instance.paramsAsObject()).toMatchObject({
          sort: '-companyname',
          'filter[companyname]': 'airfrance,axa',
          include: 'school',
          'page[size]': 10,
          'page[number]': 5,
        });
      });
    });
  });
});
