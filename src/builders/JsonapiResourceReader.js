import { merge, isEmpty } from 'lodash';

import JsonapiResourceBuilder from './JsonapiResourceBuilder';
import { splatSideloads, splatSortings, splatFilters } from '../utils/builders';

export default class JsonapiResourceReader extends JsonapiResourceBuilder {
  constructor(args = {}) {
    super({ ...args, method: (args.method || 'GET')  });

    const { sideloads = {}, sortings = [], filters = {}, dataMustBeFresherThan = null } = args;
    this.sideloads = sideloads || {};
    this.sortings = sortings || []; // Ordered array
    this.filters = filters || {};
    this.dataMustBeFresherThan = dataMustBeFresherThan;
  }

  /*
   *** Cache expiration ***
   */

  dataMustBeFresh() {
    this.dataMustBeFresherThan(new Date());
  }

  dataCanBeOld() {
    this.dataMustBeFresherThan(new Date(0));
  }

  dataMustBeFresherThan(date) {
    this.mustBeFresherThan = date;
  }

  /*
   *** Sorting & Filtering ***
   */

  /* @param {Iterable<Object>} sortings - as many objects as you want, in sort order,
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

  /* @param filters {Object} filters - List of filters to be applied
   *   - values can be either String, Boolean or Arrays
   *
   * @example filter({ company_name: ['axa', 'air france'], sector: 'it, digital', published: true]})
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

  /* @param sideloads {Object} sideloads - List of nested includes to request
   *   - end values must be the Boolean true
   *
   * @example sideload({ company: true, user: { preferences: true } })
   *   # => Will generate company and user.preferences
   *
   */
  sideload(sideloads) {
    this.sideloads = merge(this.sideloads, sideloads);
  }

  /* @param sideloads {Object} sideloads - List of nested includes to request
   *   - end values must be the Boolean true
   *
   * @return {Object} containing key/values of params and values
   *
   */
  paramsAsObject() {
    return ({
      sort: this.joinedSortings(),
      include: this.joinedSideloads(),
      ...this.mapOfJoinedFilters(),
      ...this.params
    });
  }

  /*
   * @return {Object} used for requestisation
   */
  specificActionObject() {
    return {
      params: this.paramsAsObject(),
    };
  }

  /** private **/

  /* @api private */
  get requestActionTypePrefix() {
    return 'READ';
  }

  joinedSideloads() {
    return splatSideloads('', this.sideloads).join(',');
  }

  joinedSortings() {
    return splatSortings(this.sortings).join(',');
  }

  /* @api private */
  mapOfJoinedFilters() {
    const mapOfFiltersAsPair = splatFilters('', this.filters).map(
      ([key, values]) => ({ [key]: values.map(v => encodeURIComponent(v)).join(',') }),
    )
    if(isEmpty(mapOfFiltersAsPair)) { return {} }
    else {
      return Object.assign(...mapOfFiltersAsPair);
    }
  }
}