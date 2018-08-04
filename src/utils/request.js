import normalize from 'json-api-normalizer';

/**
 * Handle HTTP methods
 * @param {Object} response
 * @throws Will throw an error when HTTP code is over 400
 */
const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 400) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
};

/**
 * Handle response and parse as JSON
 * @param {Object} response
 */
export const parseJSON = response => response
  .json()
  .catch(e => console.log('parse error', e)); // eslint-disable-line no-console

/**
 *
 * @param {String} url
 * @param {Object} data
 * @param {Object} [options] - Options of the request
 *    @see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters
 * @returns {Promise}
 */
const performRequest = (url, data, options = {}) => new Promise((resolve, reject) => {
  window.fetch(url, options)
    .then(checkStatus)
    .then(parseJSON)
    .then(response => normalize(response, { endpoint: url }))
    .then(resolve)
    .catch(reject);
});

export default performRequest;
