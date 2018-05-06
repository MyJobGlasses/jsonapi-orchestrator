import JsonapiResourceReader from '../../builders/JsonapiResourceReader';

describe('JsonapiResourceReader', () => {
  let instance;
  beforeEach(() => {
    instance = new JsonapiResourceReader({});
  });

  describe('sorting', () => {
    describe('flattens sortings for request', () => {
      test('merges appropriately nested sortings', () => {
        // ?sort=-educations.school.name
        instance.sort({ educations: { school: { name: 'desc'} } });
        expect(instance.joinedSortings())
          .toBe('-educations.school.name');
      });

      test('concatenates sortings in the order they were defined', () => {
        // ?sort=-positivelikecount,companyname
        instance.sort({ positivelikecount: 'desc'}, { companyname: 'asc'});
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
        expect(instance.mapOfJoinedFilters())
          .toEqual(expect.objectContaining({
            'filter[companyname]': 'airfrance,axa'
          }));
      });

      test('handles nested filters', () => {
        // ?filter[company][name]=airfrance,axa]
        instance.filter({ company: { name: ['airfrance', 'axa'] } });
        expect(instance.mapOfJoinedFilters())
          .toEqual(expect.objectContaining({
            'filter[company][name]': 'airfrance,axa'
          }));
      });

      test('handles multiple filters', () => {
        // ?filter[company][name]=airfrance,axa]
        instance.filter({ company: { name: ['air france', 'axa'] } });
        instance.filter({ company: { sector: ['it, digital', 'business'] } });
        expect(instance.mapOfJoinedFilters())
          .toEqual(expect.objectContaining({
            'filter[company][name]': 'air%20france,axa',
            'filter[company][sector]': 'it%2C%20digital,business'
          }));
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

  describe('parameterization', () => {
    test('aggregates all params for a request', () => {
      instance.sideload({ school: true });
      instance.filter({ companyname: ['airfrance', 'axa'] });
      instance.sort({ companyname: 'desc' });

      expect(instance.paramsAsObject()).toEqual(expect.objectContaining({
        sort: '-companyname',
        'filter[companyname]': 'airfrance,axa',
        include: 'school',
      }));
    });
  });
});