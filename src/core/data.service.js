/**
 * JSCharting AngularJS Data Service
 *
 * Provides data loading, transformation, and manipulation utilities
 * including CSV parsing, data nesting, and format conversions.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .factory('jscDataService', ['$q', '$http', function($q, $http) {

      /**
       * Check if JSC is available
       */
      function isJSCAvailable() {
        return typeof JSC !== 'undefined';
      }

      return {
        /**
         * Fetch and parse CSV data from a URL
         *
         * @param {string} url - URL to fetch
         * @param {Object} [options] - CSV parsing options
         * @param {Object} [options.columnTypes] - Column type definitions
         * @param {boolean} [options.firstRowHeaders] - First row contains headers
         * @returns {Promise<Array>} Parsed data array
         */
        fetchCsv: function(url, options) {
          var deferred = $q.defer();

          if (!isJSCAvailable()) {
            deferred.reject('JSCharting library is not loaded.');
            return deferred.promise;
          }

          JSC.fetch(url)
            .then(function(response) {
              return response.text();
            })
            .then(function(text) {
              var data = JSC.csv2Json(text, options);
              deferred.resolve(data);
            })
            .catch(function(error) {
              deferred.reject(error);
            });

          return deferred.promise;
        },

        /**
         * Parse CSV text to JSON
         *
         * @param {string} csvText - CSV text content
         * @param {Object} [options] - Parsing options
         * @returns {Array} Parsed data array
         */
        parseCsv: function(csvText, options) {
          if (!isJSCAvailable()) {
            throw new Error('JSCharting library is not loaded.');
          }
          return JSC.csv2Json(csvText, options);
        },

        /**
         * Create a nest builder for data aggregation
         *
         * @returns {Object} Nest builder with chainable methods
         */
        nest: function() {
          if (!isJSCAvailable()) {
            throw new Error('JSCharting library is not loaded.');
          }
          return JSC.nest();
        },

        /**
         * Transform data using JSC.nest with a simplified API
         *
         * @param {Array} data - Source data array
         * @param {Object} config - Nesting configuration
         * @param {Array<string>} [config.keys] - Keys to group by
         * @param {Object} [config.rollup] - Rollup configuration
         * @param {string} config.rollup.property - Property to aggregate
         * @param {string} config.rollup.calculation - Aggregation function (sum, mean, etc.)
         * @param {Function} [config.pointRollup] - Custom point rollup function
         * @returns {Array} Transformed series data
         */
        nestToSeries: function(data, config) {
          if (!isJSCAvailable()) {
            throw new Error('JSCharting library is not loaded.');
          }

          var nest = JSC.nest();

          // Apply keys
          if (config.keys && config.keys.length) {
            config.keys.forEach(function(key) {
              nest.key(key);
            });
          }

          // Apply rollup
          if (config.rollup) {
            nest.rollup(config.rollup.property, config.rollup.calculation);
          }

          // Apply point rollup
          if (config.pointRollup) {
            nest.pointRollup(config.pointRollup);
          }

          return nest.series(data);
        },

        /**
         * Convert array data to points
         *
         * @param {Array<string>} properties - Property names for array positions
         * @param {Array} data - Data arrays
         * @returns {Array} Point objects
         */
        arrayToPoints: function(properties, data) {
          if (!isJSCAvailable()) {
            throw new Error('JSCharting library is not loaded.');
          }
          return JSC.pointsFromArray(properties, data);
        },

        /**
         * Deep merge multiple configuration objects
         *
         * @param {...Object} objects - Objects to merge
         * @returns {Object} Merged object
         */
        merge: function() {
          if (!isJSCAvailable()) {
            // Fallback to angular.merge
            var result = {};
            for (var i = 0; i < arguments.length; i++) {
              angular.merge(result, arguments[i]);
            }
            return result;
          }
          return JSC.merge.apply(JSC, arguments);
        },

        /**
         * Sort data by a property
         *
         * @param {Array} data - Data to sort
         * @param {string} property - Property to sort by
         * @param {boolean} [descending] - Sort descending
         * @returns {Array} Sorted data
         */
        sortBy: function(data, property, descending) {
          if (!isJSCAvailable()) {
            // Fallback implementation
            return data.slice().sort(function(a, b) {
              var aVal = a[property];
              var bVal = b[property];
              if (aVal < bVal) return descending ? 1 : -1;
              if (aVal > bVal) return descending ? -1 : 1;
              return 0;
            });
          }
          return JSC.sortBy(data, property, descending ? 'desc' : 'asc');
        },

        /**
         * Get aggregated value from array
         *
         * @param {Array} data - Data array
         * @param {string} property - Property to aggregate
         * @param {string} calculation - Calculation type (sum, mean, min, max)
         * @returns {number} Aggregated value
         */
        aggregate: function(data, property, calculation) {
          if (!isJSCAvailable()) {
            // Fallback implementation
            var values = data.map(function(d) {
              return typeof d === 'object' ? d[property] : d;
            }).filter(function(v) {
              return typeof v === 'number' && !isNaN(v);
            });

            if (values.length === 0) return 0;

            switch (calculation) {
              case 'sum':
                return values.reduce(function(a, b) { return a + b; }, 0);
              case 'mean':
              case 'avg':
              case 'average':
                return values.reduce(function(a, b) { return a + b; }, 0) / values.length;
              case 'min':
                return Math.min.apply(Math, values);
              case 'max':
                return Math.max.apply(Math, values);
              case 'count':
                return values.length;
              default:
                return 0;
            }
          }

          switch (calculation) {
            case 'sum':
              return JSC.sum(data, property);
            case 'mean':
            case 'avg':
            case 'average':
              return JSC.mean(data, property);
            case 'min':
              return JSC.min(data, property);
            case 'max':
              return JSC.max(data, property);
            case 'count':
              return data.length;
            default:
              return 0;
          }
        },

        /**
         * Format a number
         *
         * @param {number} value - Value to format
         * @param {string} format - Format string
         * @param {string} [culture] - Culture name
         * @returns {string} Formatted string
         */
        formatNumber: function(value, format, culture) {
          if (!isJSCAvailable()) {
            return String(value);
          }
          return JSC.formatNumber(value, format, culture);
        },

        /**
         * Format a date
         *
         * @param {Date|string|number} date - Date to format
         * @param {string} format - Format string
         * @param {string} [culture] - Culture name
         * @returns {string} Formatted string
         */
        formatDate: function(date, format, culture) {
          if (!isJSCAvailable()) {
            return String(date);
          }
          return JSC.formatDate(date, format, culture);
        },

        /**
         * Get a color palette
         *
         * @param {string} paletteName - Palette name
         * @returns {Array} Array of colors
         */
        getPalette: function(paletteName) {
          if (!isJSCAvailable()) {
            return [];
          }
          return JSC.getPalette(paletteName);
        },

        /**
         * Generate a palette from a base color
         *
         * @param {string} color - Base color
         * @param {Object} [options] - Palette options
         * @returns {Array} Array of colors
         */
        colorToPalette: function(color, options) {
          if (!isJSCAvailable()) {
            return [color];
          }
          return JSC.colorToPalette(color, options);
        },

        /**
         * Create point data from x and y arrays
         *
         * @param {Array} xValues - X values
         * @param {Array} yValues - Y values
         * @returns {Array} Array of points
         */
        createPoints: function(xValues, yValues) {
          var points = [];
          var len = Math.min(xValues.length, yValues.length);

          for (var i = 0; i < len; i++) {
            points.push({
              x: xValues[i],
              y: yValues[i]
            });
          }

          return points;
        },

        /**
         * Create series from grouped data
         *
         * @param {Object} groupedData - Data grouped by series name
         * @param {Object} [seriesDefaults] - Default series options
         * @returns {Array} Array of series objects
         */
        createSeries: function(groupedData, seriesDefaults) {
          var series = [];

          angular.forEach(groupedData, function(points, name) {
            var s = angular.extend({}, seriesDefaults, {
              name: name,
              points: points
            });
            series.push(s);
          });

          return series;
        }
      };
    }]);

})(angular);
