/**
 * JSCharting AngularJS Performance Service
 *
 * Provides utilities for optimizing chart updates including
 * debouncing, throttling, and efficient change detection.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .factory('jscPerformance', ['$timeout', function($timeout) {

      /**
       * Creates a debounced function that delays invoking func until after
       * wait milliseconds have elapsed since the last time the debounced
       * function was invoked.
       *
       * @param {Function} func - The function to debounce
       * @param {number} wait - The number of milliseconds to delay
       * @param {boolean} [immediate] - If true, trigger on leading edge
       * @returns {Function} The debounced function
       */
      function debounce(func, wait, immediate) {
        var timeout;

        return function() {
          var context = this;
          var args = arguments;

          var later = function() {
            timeout = null;
            if (!immediate) {
              func.apply(context, args);
            }
          };

          var callNow = immediate && !timeout;

          if (timeout) {
            $timeout.cancel(timeout);
          }

          timeout = $timeout(later, wait);

          if (callNow) {
            func.apply(context, args);
          }
        };
      }

      /**
       * Creates a throttled function that only invokes func at most once
       * per every wait milliseconds.
       *
       * @param {Function} func - The function to throttle
       * @param {number} limit - The number of milliseconds to throttle
       * @returns {Function} The throttled function
       */
      function throttle(func, limit) {
        var inThrottle = false;
        var lastArgs = null;
        var lastContext = null;

        return function() {
          var context = this;
          var args = arguments;

          if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;

            $timeout(function() {
              inThrottle = false;
              if (lastArgs) {
                func.apply(lastContext, lastArgs);
                lastArgs = null;
                lastContext = null;
              }
            }, limit);
          } else {
            lastArgs = args;
            lastContext = context;
          }
        };
      }

      /**
       * Computes a simple hash for an object to detect changes efficiently.
       *
       * @param {*} obj - The object to hash
       * @returns {string} A hash string
       */
      function computeHash(obj) {
        if (obj === null || obj === undefined) {
          return 'null';
        }
        if (typeof obj !== 'object') {
          return String(obj);
        }
        try {
          return JSON.stringify(obj);
        } catch (e) {
          return String(obj);
        }
      }

      /**
       * Chunks a large array into smaller pieces for incremental processing.
       *
       * @param {Array} array - The array to chunk
       * @param {number} size - The chunk size
       * @returns {Array} An array of chunks
       */
      function chunk(array, size) {
        var chunks = [];
        for (var i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      }

      /**
       * Processes an array in chunks with optional delay between chunks.
       *
       * @param {Array} array - The array to process
       * @param {Function} processor - Function to process each chunk
       * @param {number} chunkSize - Size of each chunk
       * @param {number} [delay=0] - Delay between chunks in ms
       * @returns {Promise} Resolves when all chunks are processed
       */
      function processInChunks(array, processor, chunkSize, delay) {
        delay = delay || 0;
        var chunks = chunk(array, chunkSize);
        var index = 0;

        return new Promise(function(resolve) {
          function processNext() {
            if (index >= chunks.length) {
              resolve();
              return;
            }

            processor(chunks[index], index);
            index++;

            if (delay > 0) {
              $timeout(processNext, delay);
            } else {
              $timeout(processNext, 0);
            }
          }

          processNext();
        });
      }

      /**
       * Downsamples data for initial render, keeping every nth point.
       *
       * @param {Array} data - The data array
       * @param {number} maxPoints - Maximum number of points to keep
       * @returns {Array} Downsampled data
       */
      function downsample(data, maxPoints) {
        if (!data || data.length <= maxPoints) {
          return data;
        }

        var step = Math.ceil(data.length / maxPoints);
        var result = [];

        for (var i = 0; i < data.length; i += step) {
          result.push(data[i]);
        }

        // Always include the last point
        if (result[result.length - 1] !== data[data.length - 1]) {
          result.push(data[data.length - 1]);
        }

        return result;
      }

      /**
       * Checks if two values are shallowly equal.
       *
       * @param {*} a - First value
       * @param {*} b - Second value
       * @returns {boolean} True if shallowly equal
       */
      function shallowEqual(a, b) {
        if (a === b) {
          return true;
        }

        if (typeof a !== typeof b) {
          return false;
        }

        if (typeof a !== 'object' || a === null || b === null) {
          return false;
        }

        var keysA = Object.keys(a);
        var keysB = Object.keys(b);

        if (keysA.length !== keysB.length) {
          return false;
        }

        for (var i = 0; i < keysA.length; i++) {
          var key = keysA[i];
          if (a[key] !== b[key]) {
            return false;
          }
        }

        return true;
      }

      return {
        debounce: debounce,
        throttle: throttle,
        computeHash: computeHash,
        chunk: chunk,
        processInChunks: processInChunks,
        downsample: downsample,
        shallowEqual: shallowEqual
      };
    }]);

})(angular);
