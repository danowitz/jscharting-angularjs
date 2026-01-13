/**
 * JSCharting AngularJS Chart Factory Provider
 *
 * Factory for creating, managing, and destroying JSCharting instances.
 * Provides instance tracking and lifecycle management.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .provider('jscChartFactory', function() {

      // Factory configuration
      var config = {
        trackInstances: true,
        autoDestroy: true
      };

      /**
       * Enable or disable instance tracking
       * @param {boolean} enabled
       */
      this.setTrackInstances = function(enabled) {
        config.trackInstances = !!enabled;
        return this;
      };

      /**
       * Enable or disable auto-destroy on scope destroy
       * @param {boolean} enabled
       */
      this.setAutoDestroy = function(enabled) {
        config.autoDestroy = !!enabled;
        return this;
      };

      this.$get = ['$q', '$timeout', 'jscModuleLoader', 'jscConfig',
        function($q, $timeout, jscModuleLoader, jscConfig) {

          // Track all chart instances
          var instances = {};
          var instanceCounter = 0;

          /**
           * Generate a unique instance ID
           * @returns {string}
           */
          function generateId() {
            return 'jsc_' + (++instanceCounter) + '_' + Date.now();
          }

          /**
           * Ensure JSC is available globally
           * @returns {boolean}
           */
          function isJSCAvailable() {
            return typeof JSC !== 'undefined' && typeof JSC.chart === 'function';
          }

          return {
            /**
             * Create a new chart instance
             *
             * @param {HTMLElement|string} target - Target element or element ID
             * @param {Object} options - Chart configuration
             * @param {Function} [callback] - Optional callback after chart loads
             * @returns {Promise<Object>} Resolves with chart instance
             */
            create: function(target, options, callback) {
              var deferred = $q.defer();

              if (!isJSCAvailable()) {
                deferred.reject('JSCharting library is not loaded. Please include jscharting.js.');
                return deferred.promise;
              }

              // Merge with defaults
              var mergedOptions = jscConfig.mergeWithDefaults(options);

              // Load required modules based on chart type
              jscModuleLoader.loadForType(mergedOptions.type).then(function() {
                try {
                  var chart = JSC.chart(target, mergedOptions, function() {
                    $timeout(function() {
                      // Track instance if enabled
                      if (config.trackInstances) {
                        var id = (typeof target === 'string' ? target : null) || generateId();
                        instances[id] = {
                          chart: chart,
                          id: id,
                          created: Date.now()
                        };
                        chart.__jscAngularId = id;
                      }

                      if (callback) {
                        callback(chart);
                      }

                      deferred.resolve(chart);
                    });
                  });
                } catch (e) {
                  deferred.reject('Error creating chart: ' + e.message);
                }
              }).catch(function(error) {
                deferred.reject(error);
              });

              return deferred.promise;
            },

            /**
             * Create a chart synchronously (for use in directive link)
             * Returns the chart instance immediately but it may not be fully rendered.
             *
             * @param {HTMLElement|string} target - Target element or element ID
             * @param {Object} options - Chart configuration
             * @param {Function} [callback] - Optional callback after chart loads
             * @returns {Object|null} Chart instance or null if creation fails
             */
            createSync: function(target, options, callback) {
              if (!isJSCAvailable()) {
                console.error('JSCharting library is not loaded.');
                return null;
              }

              try {
                // Merge with defaults
                var mergedOptions = jscConfig.mergeWithDefaults(options);

                var chart = JSC.chart(target, mergedOptions, function() {
                  $timeout(function() {
                    // Track instance if enabled
                    if (config.trackInstances) {
                      var id = (typeof target === 'string' ? target : null) || generateId();
                      instances[id] = {
                        chart: chart,
                        id: id,
                        created: Date.now()
                      };
                      chart.__jscAngularId = id;
                    }

                    if (callback) {
                      callback(chart);
                    }
                  });
                });

                return chart;
              } catch (e) {
                console.error('Error creating chart:', e);
                return null;
              }
            },

            /**
             * Get an existing chart instance by ID
             * @param {string} id - Chart ID
             * @returns {Object|null} Chart instance or null
             */
            get: function(id) {
              var entry = instances[id];
              return entry ? entry.chart : null;
            },

            /**
             * Get all active chart instances
             * @returns {Object} Map of ID to chart info
             */
            getAll: function() {
              var result = {};
              angular.forEach(instances, function(entry, id) {
                result[id] = {
                  chart: entry.chart,
                  id: entry.id,
                  created: entry.created
                };
              });
              return result;
            },

            /**
             * Get the count of active instances
             * @returns {number}
             */
            getCount: function() {
              return Object.keys(instances).length;
            },

            /**
             * Destroy a chart instance
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @returns {boolean} True if destroyed
             */
            destroy: function(idOrChart) {
              var chart;
              var id;

              if (typeof idOrChart === 'string') {
                id = idOrChart;
                var entry = instances[id];
                if (entry) {
                  chart = entry.chart;
                }
              } else if (idOrChart && typeof idOrChart.destroy === 'function') {
                chart = idOrChart;
                id = chart.__jscAngularId;
              }

              if (chart) {
                try {
                  chart.destroy();
                } catch (e) {
                  console.warn('Error destroying chart:', e);
                }

                // Remove from tracking
                if (id && instances[id]) {
                  delete instances[id];
                }

                return true;
              }

              return false;
            },

            /**
             * Destroy all chart instances
             */
            destroyAll: function() {
              var self = this;
              Object.keys(instances).forEach(function(id) {
                self.destroy(id);
              });
            },

            /**
             * Update a chart's options
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @param {Object} options - New options
             * @param {Object} [updateOptions] - Update options (animation, etc.)
             * @returns {boolean} True if updated
             */
            update: function(idOrChart, options, updateOptions) {
              var chart;

              if (typeof idOrChart === 'string') {
                chart = this.get(idOrChart);
              } else {
                chart = idOrChart;
              }

              if (chart && typeof chart.options === 'function') {
                try {
                  chart.options(options, updateOptions);
                  return true;
                } catch (e) {
                  console.warn('Error updating chart:', e);
                }
              }

              return false;
            },

            /**
             * Check if JSCharting is available
             * @returns {boolean}
             */
            isAvailable: function() {
              return isJSCAvailable();
            },

            /**
             * Get JSCharting library version
             * @returns {string|null}
             */
            getVersion: function() {
              if (isJSCAvailable() && JSC.version) {
                return JSC.version;
              }
              return null;
            },

            /**
             * Export chart as image
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @param {Object} [options] - Export options
             * @param {string} [options.type='png'] - Image type: 'png', 'jpg', 'svg', 'pdf'
             * @param {string} [options.filename] - Download filename
             * @param {number} [options.width] - Image width
             * @param {number} [options.height] - Image height
             * @returns {Promise} Resolves when export is complete
             */
            exportImage: function(idOrChart, options) {
              var deferred = $q.defer();
              var chart = typeof idOrChart === 'string' ? this.get(idOrChart) : idOrChart;

              if (!chart || typeof chart.exportImage !== 'function') {
                deferred.reject('Chart not found or does not support export');
                return deferred.promise;
              }

              try {
                var exportOptions = angular.extend({
                  type: 'png'
                }, options);

                chart.exportImage(exportOptions);
                deferred.resolve();
              } catch (e) {
                deferred.reject('Export failed: ' + e.message);
              }

              return deferred.promise;
            },

            /**
             * Print chart
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @returns {boolean} True if print initiated
             */
            print: function(idOrChart) {
              var chart = typeof idOrChart === 'string' ? this.get(idOrChart) : idOrChart;

              if (chart && typeof chart.print === 'function') {
                try {
                  chart.print();
                  return true;
                } catch (e) {
                  console.warn('Print failed:', e);
                }
              }

              return false;
            },

            /**
             * Add points to a series with optional shift
             * Useful for real-time/streaming data
             *
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @param {number} seriesIndex - Series index (0-based)
             * @param {Object|Array} points - Point(s) to add
             * @param {Object} [options] - Add options
             * @param {boolean} [options.shift=false] - Remove first point when adding
             * @returns {boolean} True if points added
             */
            addPoints: function(idOrChart, seriesIndex, points, options) {
              var chart = typeof idOrChart === 'string' ? this.get(idOrChart) : idOrChart;

              if (chart && typeof chart.series === 'function') {
                try {
                  var series = chart.series(seriesIndex);
                  if (series && series.points && typeof series.points.add === 'function') {
                    series.points.add(points, options);
                    return true;
                  }
                } catch (e) {
                  console.warn('Failed to add points:', e);
                }
              }

              return false;
            },

            /**
             * Remove points from a series
             *
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @param {number} seriesIndex - Series index
             * @param {number|Array} pointIndices - Point index or array of indices to remove
             * @returns {boolean} True if points removed
             */
            removePoints: function(idOrChart, seriesIndex, pointIndices) {
              var chart = typeof idOrChart === 'string' ? this.get(idOrChart) : idOrChart;

              if (chart && typeof chart.series === 'function') {
                try {
                  var series = chart.series(seriesIndex);
                  if (series && series.points) {
                    var indices = Array.isArray(pointIndices) ? pointIndices : [pointIndices];
                    // Remove from end to preserve indices
                    indices.sort(function(a, b) { return b - a; });
                    indices.forEach(function(idx) {
                      var point = series.points(idx);
                      if (point && typeof point.remove === 'function') {
                        point.remove();
                      }
                    });
                    return true;
                  }
                } catch (e) {
                  console.warn('Failed to remove points:', e);
                }
              }

              return false;
            },

            /**
             * Zoom chart to specified range
             *
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @param {Object} range - Zoom range
             * @param {number} [range.xMin] - X axis minimum
             * @param {number} [range.xMax] - X axis maximum
             * @param {number} [range.yMin] - Y axis minimum
             * @param {number} [range.yMax] - Y axis maximum
             * @returns {boolean} True if zoom applied
             */
            zoom: function(idOrChart, range) {
              var chart = typeof idOrChart === 'string' ? this.get(idOrChart) : idOrChart;

              if (chart && typeof chart.zoom === 'function') {
                try {
                  chart.zoom(range);
                  return true;
                } catch (e) {
                  console.warn('Failed to zoom:', e);
                }
              }

              return false;
            },

            /**
             * Reset chart zoom
             *
             * @param {string|Object} idOrChart - Chart ID or chart instance
             * @returns {boolean} True if zoom reset
             */
            resetZoom: function(idOrChart) {
              var chart = typeof idOrChart === 'string' ? this.get(idOrChart) : idOrChart;

              if (chart && typeof chart.zoom === 'function') {
                try {
                  chart.zoom(1); // Reset to 100%
                  return true;
                } catch (e) {
                  console.warn('Failed to reset zoom:', e);
                }
              }

              return false;
            }
          };
        }
      ];
    });

})(angular);
