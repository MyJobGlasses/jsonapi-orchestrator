import { merge } from 'lodash';

import { JsonapiResourceBuilder } from './JsonapiResourceBuilder';
import { splatSideloads, splatSortings, splatFilters } from '../utils/builders';

export default class JsonapiResourceReader {
  constructor(args = {}) {
    // super(args);
    const { sideloads = {}, sortings = [], filters = {}, dataMustBeFresherThan = null } = args;
    this.sideloads = sideloads;
    this.sortings = sortings;
    this.filters = filters;
    this.dataMustBeFresherThan = dataMustBeFresherThan;
  }

  /* Cache expiration */

  dataMustBeFresh() {
    this.dataMustBeFresherThan(new Date());
  }

  dataCanBeOld() {
    this.dataMustBeFresherThan(new Date(0));
  }

  dataMustBeFresherThan(date) {
    this.mustBeFresherThan = date;
  } // If we want to ensure data is fresher than

  /* Sorting & Filtering */

  sort(...sortings) {
    this.sortings = this.sortings.concat(sortings);
  }

  filter(filters) {
    this.filters = merge(this.filters, filters);
  }

  /* Sideloading via include */

  sideload(sideloadHash) {
    this.sideloads = merge(this.sideloads, sideloadHash);
  }

  _flattenSideloads() {
    return splatSideloads('', this.sideloads).join(',');
  }

  _flattenSortings() {
    return splatSortings(this.sortings).join(',');
  }

  _flattenFilters() {
    return splatFilters('', this.filters).map(
      ([key, values]) => `${key}=${ values.map( (v) => encodeURIComponent(v)).join(',') }`
    ).join(',');
  }
}