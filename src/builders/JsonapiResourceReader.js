import { merge, isEmpty, omitBy, isNil } from 'lodash';

import JsonapiResourceBuilder from './JsonapiResourceBuilder';
import { splatSideloads, splatSortings, splatFilters } from '../utils/builders';

export default class JsonapiResourceReader extends JsonapiResourceBuilder {
  /**
   * @param {Object} args See inherited params from @JsonapiResourceBuilder
   * @param {Object} args.sideloads See {@link #sideload()}
   * @param {Object[]} args.sortings See {@link #sort()}
   * @param {Object} args.filters See {@link #filter()}
   * @param {Object} args.page See {@link #page()}
   * @param {Date} args.dataMustBeFresherThan See {@link #dataMustBeFresherThan()}
   */
  constructor(args = {}) {
    super(args);

    const {
      sideloads = {},
      sortings = [],
      filters = {},
      page = {},
      dataMustBeFresherThan = null,
    } = args;

    this.sideloads = sideloads;
    this.sortings = sortings; // Ordered array
    this.filters = filters;
    this.paginationFilters = page;
    this.dataMustBeFresherThan = dataMustBeFresherThan;
  }

  /*
   *** Cache expiration ***
   */

  /**
   * Forces request to refresh all caches
   */
  dataMustBeFresh() {
    this.dataMustBeFresherThan(new Date());
  }

  /**
   * Incicates the resource can reuse any existing cache
   */
  dataCanBeOld() {
    this.dataMustBeFresherThan(new Date(0));
  }

  /**
   * Indicates the resource can reuse existing cache if newer that +date+
   * @param {Date}
   */
  dataMustBeFresherThan(date) {
    this.mustBeFresherThan = date;
  }

  /**
   ***************************
   *** Sorting & Filtering ***
   ***************************
   */

  /**
   * @param {Iterable<Object>} sortings - as many objects as you want, in sort order,
   *   the end values must be either 'asc' or 'desc'
   *
   * @example sort({ company: { name: 'asc' } }, { rating: 'desc' })
   *   # => will remember sorting
   *        - FIRST on company.name (asc assumed to mean Alphabetically)
   *        - SECOND on rating (desc assumed to mean best-rated first)
   */
  sort(...sortings) {
    this.sortings = this.sortings.concat(sortings);
  }

  /**
   * @param filters {Object} filters - List of filters to be applied
   *   - values can be either String, Boolean or Arrays
   *
   * @example
   *
   *   filter({ company_name: ['axa', 'air france'], sector: 'it, digital', published: true]})
   *   # => Will remember filtering on
   *     - company_names either 'axa' or 'air france'
   *     - sectors 'it, digital' (the ',' will be URLEncoded)
   *     - published
   *
   */
  filter(filters) {
    this.filters = merge(this.filters, filters);
  }

  /* Sideloading via include */

  /**
   * @param sideloads {Object} sideloads - List of nested includes to request
   *   - end values must be the Boolean true
   *
   * @example sideload({ company: true, user: { preferences: true } })
   *   # => Will generate company and user.preferences
   *
   */
  sideload(sideloads) {
    this.sideloads = merge(this.sideloads, sideloads);
  }

  /**
   * @param {Object} page - List of pagination filters
   *   - Implementation depends on the server, see https://jsonapi.org/format/#fetching-pagination
   *
   * @example page({ size: 100, number: 2 })
   *
   */
  page(pageFilters) {
    this.paginationFilters = merge(this.paginationFilters, pageFilters);
  }

  /**
   * Serialize all filters, sortings, params and includes, and make an object from it
   * @return {Object}
   * @return {String} return.sort
   * @return {String} return.include
   * @return {Object} return.params
   * @return {Object[]} return[variousKeys] List of filters
   *
   * @example
   *
   *  new JsonapiResourceReader({
   *    type: 'employee',
   *    filters: { company: { name: ['AXA', 'AIR France']}, sector: 'it_digital' }),
   *    include: { admins: { entity: true }} }),
   *    sortings: [{ employees: { size: 'desc'}, { size: 'asc' }]
   *  }).paramsAsObject()
   *  # => {
   *    sort: '-employees[size],size',
   *    include: 'admins.entity',
   *    filter[company][name]: 'AXA*,AIR%20France'
   *    filter[company][sector]: 'it%xxdigital',
   *    params: {}
   *  }
   *
   */
  paramsAsObject() {
    return ({
      sort: this.joinedSortings(),
      include: this.joinedSideloads(),
      ...this.mapOfPaginationFilters(),
      ...this.mapOfJoinedFilters(),
      ...this.params,
    });
  }

  /**
   * @override - No extra action keys are needed to represent READ requests
   * @return {Object}
   */
  // eslint-disable-next-line class-methods-use-this
  asReduxAction() {
    return {};
  }

  /**
   * Return options to be added to fetch
   * NOTE : some fetch implementations like node-fetch
   * DO NOT add fetchOptions.params to the URL
   * So make sure to use .urlParams from the requestBuilder
   * @return {Object}
   */
  fetchOptions() {
    return ({ params: this.paramsAsObject });
  }

  /**
   * Reads should add basically all params in the URL
   * @return {Object}
   */
  urlParams() {
    return omitBy(this.paramsAsObject(), (i) => !i);
  }

  /**
   * @override
   */
  // eslint-disable-next-line class-methods-use-this
  requestActionTypePrefix() {
    return 'READ';
  }

  /**
   * @return {String}
   */
  joinedSideloads() {
    return splatSideloads('', this.sideloads).join(',');
  }

  /**
   * @return {String}
   */
  joinedSortings() {
    return splatSortings(this.sortings).join(',');
  }

   /**
   * @api private
   * @return {Object[]}
   */
  mapOfPaginationFilters() {
    if (isEmpty(this.paginationFilters)) { return {}; }

    return Object.keys(this.paginationFilters).map((nestedKey) => ({
      [`page[${nestedKey}]`]: this.paginationFilters[nestedKey],
    }));
  }

  /**
   * @api private
   * @return {Object[]}
   */
  mapOfJoinedFilters() {
    const mapOfFiltersAsPair = splatFilters('', this.filters)
      .map(([key, values]) => ({
        [key]: values.map(v => encodeURIComponent(v)).join(','),
      }));
    if (isEmpty(mapOfFiltersAsPair)) { return {}; }

    return Object.assign(...mapOfFiltersAsPair);
  }
}
