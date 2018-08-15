import {
  flatten,
  isObject, isArray, isString, isBoolean,
  omit,
  forOwn,
  clone,
} from 'lodash';

/**
 * Raise meaningful errors in case the construction of the jsonapi is incomplete
 * and prevents the generation of the requestActionType for redux
 *
 * @param  {[type]} typePrefix  [description]
 * @param  {[type]} jsonapiType [description]
 * @return {[type]}             [description]
 */
export const requestActionType = (typePrefix, jsonapiType) => {
  if (!typePrefix) {
    throw new Error('You need to set the action type (Create, update, etc.) of your resource !');
  }
  if (!jsonapiType) {
    throw new Error('You need to set the jsonapiType of your resource !');
  }
  return `${typePrefix.toUpperCase()}_${jsonapiType.toUpperCase()}_RESOURCE`;
};

/**
 * Resolve path dulications of sideloadings,
 * and make an array that is very easy to merge for json:api compliance
 *
 * @param { Object } startingSideloadPath - Current path to start from
 * @param { Object } nestedSideloads - nested sideloads to merge
 * @return { Array }
 *
 * @example
 *   splatSideloads('mainProfile.user', { avatar: true, profiles: { user: true } })
 *   # => ['mainProfile.user.avatar', 'mainProfile.user.profiles.user']
 */
export const splatSideloads = (startingSideloadPath = '', nestedSideloads = {}) => {
  const currentSideloads = [];
  Object.keys(nestedSideloads).forEach((nestedKey) => {
    const currentSideloadValue = nestedSideloads[nestedKey];
    let currentSideloadPath;
    if (startingSideloadPath === '') {
      currentSideloadPath = nestedKey;
    } else {
      currentSideloadPath = `${startingSideloadPath}.${nestedKey}`;
    }
    if (currentSideloadValue === true) {
      currentSideloads.push(currentSideloadPath);
    } else if (isObject(currentSideloadValue)) {
      currentSideloads.push(splatSideloads(currentSideloadPath, currentSideloadValue));
    } else {
      throw new Error(`Sideloading only accepts true or nested objects as sideloads, but received ${currentSideloadValue}`);
    }
  });
  return flatten(currentSideloads);
};

/**
 * Resolve path dulications of filters,
 * and make an array of filter/value(s) pairs that is very easy to merge for json:api compliance
 *
 * @param { Object } startingFilterPath - Current path to start from
 * @param { Object } nestedFilters - nested filters to merge
 * @return { Array } of filter => Array value pair
 *
 * @example
 *   splatFilters('mainProfile.user',
 *     { avatar: [true], firstName: ['Martine', 'Albert'], notifications: { newsletter: true } }
 *   )
 *   # => [
 *     ['mainProfile[user][avatar]', [true]],
 *     ['mainProfile[user][firstName]', ['Martine', 'Albert']
 *     ['mainProfile[user][notifications][newsletter]', [true]
 *    ]
 */
export const splatFilters = (startingFilterPath = '', nestedFilters = {}) => {
  let currentFilters = [];
  Object.keys(nestedFilters).forEach((nestedKey) => {
    const currentFilterValue = nestedFilters[nestedKey];
    let currentFilterPath;
    if (startingFilterPath === '') {
      currentFilterPath = `filter[${nestedKey}]`;
    } else {
      currentFilterPath = `${startingFilterPath}[${nestedKey}]`;
    }
    if (isObject(currentFilterValue) && !isArray(currentFilterValue)) {
      currentFilters = currentFilters
        .concat(splatFilters(currentFilterPath, currentFilterValue, true));
    } else if (
      isString(currentFilterValue) ||
      isArray(currentFilterValue) ||
      isBoolean(currentFilterValue)
    ) {
      currentFilters.push([
        currentFilterPath,
        isArray(currentFilterValue) ? currentFilterValue : [currentFilterValue],
      ]);
    } else {
      throw new Error(`Filtering only accepts nested objects or strings or arrays as Filters, but received ${currentFilterValue}`);
    }
  });
  return currentFilters;
};

/**
 * Assemble sorting paths,
 * and make an array of filter/value(s) pairs that is very easy to merge for json:api compliance
 *
 * @param { Array<Object> } sortings - List of sorting hashes
 * @return { Array } of sortings with +/- prefix
 *
 * @example
 *   splatSortings([ { avatar: [true] }, { notifications: { newsletter: true } }])
 *   # => ['-avatar', 'notifications[newsletter]']
 */
export const splatSortings = sortings => sortings.map((sorting) => {
  let [currentSortKey] = Object.keys(sorting);
  let currentSortPath = currentSortKey;
  let currentSortValueOrObject = sorting[currentSortKey];
  while (isObject(currentSortValueOrObject)) {
    [currentSortKey] = Object.keys(currentSortValueOrObject);
    currentSortPath = `${currentSortPath}.${currentSortKey}`;
    currentSortValueOrObject = currentSortValueOrObject[currentSortKey];
  }
  if (currentSortValueOrObject === 'asc') {
    return currentSortPath;
  } else if (currentSortValueOrObject === 'desc') {
    return `-${currentSortPath}`;
  }
  throw new Error(`Sorting only accepts nested objects with ending values being strings 'asc' or 'desc', but received ${currentSortValueOrObject}`);
});

/**
 * @private
 *
 * Replace placeholder params in URLs
 *
 * @param url { String } url with placeholders
 * @param params { Object } params
 *
 * @return { Object } Object including new URL and replaced params
 *
 * @example
 *   replaceURlPlaceholders('/conversations/:id', { id 'cafebabe', otherParam: 'deadbeef' })
 *   # => { url: '/conversations/cafebabe', replacedParams: [:id] }
 */
const replaceUrlPlaceholders = (url, params) => {
  let mappedRoute = clone(url);
  const replacedParams = [];
  forOwn(params, (value, key) => {
    const placeholder = `:${key}`;
    if (mappedRoute.indexOf(placeholder) !== -1) {
      mappedRoute = mappedRoute.replace(placeholder, value.toString());
      replacedParams.push(key);
    }
  });
  return { url: mappedRoute, replacedParams };
};

/**
 * @private
 *
 * Merge params in URL params
 *
 * @example
 *
 *   mergeParamsInUrlParams('/conversation/:id?param1=1&param2=2', { param2: 2bis, param3: 3 })
 *   # => '/conversation/:id?param1=1&param2=2bis&param3=3'
 *
 */
const mergeParamsInUrlParams = (url, params) => {
  const originalSearchParams = url.split('?')[1] || '';
  // TODO: @Dima polyfill URLSearchParams
  const paramsManager = new URLSearchParams(originalSearchParams);
  Object.keys(params).forEach(k => paramsManager.set(k, params[k]));
  const hasNoParams = paramsManager.keys().next().done;
  if (originalSearchParams) {
    return url.replace(`?${originalSearchParams}`, `?${paramsManager.toString()}`);
  } else if (hasNoParams) {
    return url;
  }
  return `${url}?${paramsManager.toString()}`;
};

/**
 * Replace URL placeholders by params when or available,
 * and add unmerged params as regular URL params
 *
 * @example
 *
 *   mergeParamsInUrlParams(
 *     '/conversation/:id?param1=1',
 *     { id: 'cafebabe', param2: 2bis, param3: 3 })
 *   )
 *   # => '/conversation/cafebabe?param1=1&param2=2bis&param3=3'
 *
 * @param {String} originalUrl
 * @param {Object} params
 * @return {String}
 */
export const mergeParamsInUrlPlaceholdersAndParams = (originalUrl, params) => {
  const { url, replacedParams } = replaceUrlPlaceholders(originalUrl, params);
  return mergeParamsInUrlParams(url, omit(params, replacedParams));
};
