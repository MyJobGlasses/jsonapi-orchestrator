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
 *
 * @param {String} url
 * @param {Object} data
 * @param {Object} [options] - Options of the request
 *    @see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters
 */
const performRequest = (url, data, options = {}) => {
  window.fetch(url, options)
    .then(checkStatus);
};

export default performRequest;
