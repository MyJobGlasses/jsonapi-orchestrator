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
        expect(instance._flattenSortings())
          .toBe('-educations.school.name');
      });

      test('concatenates sortings in the order they were defined', () => {
        // ?sort=-positive_like_count,company_name
        instance.sort({ positive_like_count: 'desc'}, { company_name: 'asc'});
        expect(instance._flattenSortings())
          .toBe('-positive_like_count,company_name');
      });
    });
  });

  describe('filtering', () => {
    describe('flattens filters for request', () => {
      test('merges appropriately filters', () => {
        // ?filter[company_name]=air_france,axa]
        instance.filter({ company_name: ['air_france', 'axa'] });
        expect(instance._flattenFilters())
          .toBe('filter[company_name]=air_france,axa');
      });

      test('handles nested filters', () => {
        // ?filter[company][name]=air_france,axa]
        instance.filter({ company: { name: ['air_france', 'axa'] } });
        expect(instance._flattenFilters())
          .toBe('filter[company][name]=air_france,axa');
      });
    });
  });

  describe('sideloading', () => {
    describe('flattens sideloads for request', () => {

      test('merges appropriately single nested routes into a single string', () => {
        instance.sideload({ profiles: { user: true } });
        expect(instance._flattenSideloads())
          .toBe('profiles.user');
      });

      test('duplicates forking sideloading routes into multiple strings', () => {
        instance.sideload({ avatar: true, profiles: { user: true } });
        expect(instance._flattenSideloads())
          .toBe('avatar,profiles.user');
      });

      test('merges multiple distinct sideloads', () => {
        instance.sideload({ avatar: true });
        instance.sideload({ profiles: { user: true } });
        expect(instance._flattenSideloads())
          .toBe('avatar,profiles.user');
      });

      test('merges multiple sideloads sharing common path', () => {
        instance.sideload({ profiles: { user: true } });
        instance.sideload({ profiles: { user: { organization: true } } });
        expect(instance._flattenSideloads())
          .toBe('profiles.user.organization');
      });
    });
  });
});
