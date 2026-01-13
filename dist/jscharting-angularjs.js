/**
 * jscharting-angularjs v1.0.0
 * Comprehensive AngularJS wrapper for JSCharting v3.4 - Exposes all 150+ chart types through AngularJS directives and services
 *
 * Copyright (c) 2026
 * License: MIT
 */
/**
 * JSCharting AngularJS Core Module
 *
 * Provides the foundation for all JSCharting AngularJS components.
 * This module contains the core directive, services, and providers.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core', []);

})(angular);

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

/**
 * JSCharting AngularJS Module Loader Provider
 *
 * Handles lazy loading of JSCharting modules (maps.js, types.js, etc.)
 * based on chart type requirements.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .provider('jscModuleLoader', function() {

      // Base URL for JSCharting modules
      var baseUrl = '../JSC/';

      // Track loaded modules
      var loadedModules = {};

      // Map chart types to required modules
      var moduleMap = {
        // Map charts require maps module
        'map': 'modules/maps.js',

        // Specialty chart types require types module
        'organizational': 'modules/types.js',
        'gantt': 'modules/types.js',
        'calendar': 'modules/types.js',
        'treemap': 'modules/types.js',
        'chord': 'modules/types.js',
        'sankey': 'modules/types.js',
        'heatmap': 'modules/types.js',
        'radar': 'modules/types.js',
        'polar': 'modules/types.js',
        'funnel': 'modules/types.js',
        'pyramid': 'modules/types.js',
        'venn': 'modules/types.js',
        'wordcloud': 'modules/types.js',
        'circular': 'modules/types.js'
      };

      /**
       * Set the base URL for JSCharting modules
       * @param {string} url - The base URL
       */
      this.setBaseUrl = function(url) {
        baseUrl = url;
        if (baseUrl && !baseUrl.endsWith('/')) {
          baseUrl += '/';
        }
      };

      /**
       * Add or update a module mapping
       * @param {string} type - Chart type
       * @param {string} module - Module path (relative to baseUrl)
       */
      this.addModuleMapping = function(type, module) {
        moduleMap[type.toLowerCase()] = module;
      };

      /**
       * Get all module mappings
       * @returns {Object} Module mappings
       */
      this.getModuleMappings = function() {
        return angular.copy(moduleMap);
      };

      this.$get = ['$q', '$document', function($q, $document) {

        /**
         * Load a script dynamically
         * @param {string} src - Script source URL
         * @returns {Promise} Resolves when loaded
         */
        function loadScript(src) {
          var deferred = $q.defer();
          var fullSrc = baseUrl + src;

          // Already loaded
          if (loadedModules[src]) {
            deferred.resolve();
            return deferred.promise;
          }

          // Check if script already exists in DOM
          var existingScripts = document.querySelectorAll('script[src="' + fullSrc + '"]');
          if (existingScripts.length > 0) {
            loadedModules[src] = true;
            deferred.resolve();
            return deferred.promise;
          }

          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = fullSrc;
          script.async = true;

          script.onload = function() {
            loadedModules[src] = true;
            deferred.resolve();
          };

          script.onerror = function() {
            deferred.reject('Failed to load module: ' + fullSrc);
          };

          document.head.appendChild(script);
          return deferred.promise;
        }

        /**
         * Extract the base chart type from a type string
         * @param {string} type - Full chart type string
         * @returns {string} Base type
         */
        function extractBaseType(type) {
          if (!type) {
            return null;
          }

          // Type can contain multiple modifiers: "horizontal column solid"
          // Extract the first word that matches a known type
          var parts = type.toLowerCase().split(/\s+/);

          for (var i = 0; i < parts.length; i++) {
            if (moduleMap[parts[i]]) {
              return parts[i];
            }
          }

          return parts[0];
        }

        return {
          /**
           * Load modules required for a chart type
           * @param {string} type - Chart type
           * @returns {Promise} Resolves when modules are loaded
           */
          loadForType: function(type) {
            if (!type) {
              return $q.resolve();
            }

            var baseType = extractBaseType(type);
            var module = moduleMap[baseType];

            if (module && !loadedModules[module]) {
              return loadScript(module);
            }

            return $q.resolve();
          },

          /**
           * Preload specific modules
           * @param {Array<string>} modules - Module paths to load
           * @returns {Promise} Resolves when all modules are loaded
           */
          preload: function(modules) {
            var promises = modules.map(function(mod) {
              return loadScript(mod);
            });
            return $q.all(promises);
          },

          /**
           * Load the toolbar module
           * @returns {Promise}
           */
          loadToolbar: function() {
            return loadScript('modules/toolbar.js');
          },

          /**
           * Load the data grid module
           * @returns {Promise}
           */
          loadDataGrid: function() {
            return loadScript('modules/datagrid.js');
          },

          /**
           * Load the maps module
           * @returns {Promise}
           */
          loadMaps: function() {
            return loadScript('modules/maps.js');
          },

          /**
           * Load the types module
           * @returns {Promise}
           */
          loadTypes: function() {
            return loadScript('modules/types.js');
          },

          /**
           * Load the accessibility module
           * @returns {Promise}
           */
          loadAccessibility: function() {
            return loadScript('modules/accessibility.js');
          },

          /**
           * Check if a module is loaded
           * @param {string} module - Module path
           * @returns {boolean}
           */
          isLoaded: function(module) {
            return !!loadedModules[module];
          },

          /**
           * Get the base URL
           * @returns {string}
           */
          getBaseUrl: function() {
            return baseUrl;
          },

          /**
           * Set the base URL at runtime
           * @param {string} url - The base URL
           */
          setBaseUrl: function(url) {
            baseUrl = url;
            if (baseUrl && !baseUrl.endsWith('/')) {
              baseUrl += '/';
            }
          }
        };
      }];
    });

})(angular);

/**
 * JSCharting AngularJS Config Provider
 *
 * Provides global default configuration for all JSCharting components.
 * Configure in your app's config phase.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .provider('jscConfig', function() {

      // Global default configuration
      var defaults = {
        debug: false,
        animation: {
          duration: 400
        }
      };

      // Default event debounce time in ms
      var eventDebounceTime = 50;

      // Default update debounce time in ms
      var updateDebounceTime = 100;

      /**
       * Set default configuration that applies to all charts
       * @param {Object} config - Default configuration object
       */
      this.setDefaults = function(config) {
        angular.merge(defaults, config);
        return this;
      };

      /**
       * Get current defaults
       * @returns {Object} Current default configuration
       */
      this.getDefaults = function() {
        return angular.copy(defaults);
      };

      /**
       * Set debug mode for all charts
       * @param {boolean} enabled - Enable or disable debug mode
       */
      this.setDebug = function(enabled) {
        defaults.debug = !!enabled;
        return this;
      };

      /**
       * Set default animation settings
       * @param {Object} animation - Animation configuration
       */
      this.setAnimation = function(animation) {
        defaults.animation = angular.extend({}, defaults.animation, animation);
        return this;
      };

      /**
       * Set default palette
       * @param {string|Array} palette - Palette name or array of colors
       */
      this.setPalette = function(palette) {
        defaults.palette = palette;
        return this;
      };

      /**
       * Set event debounce time
       * @param {number} ms - Milliseconds
       */
      this.setEventDebounceTime = function(ms) {
        eventDebounceTime = ms;
        return this;
      };

      /**
       * Set update debounce time
       * @param {number} ms - Milliseconds
       */
      this.setUpdateDebounceTime = function(ms) {
        updateDebounceTime = ms;
        return this;
      };

      /**
       * Set default tooltip configuration
       * @param {Object} tooltip - Tooltip configuration
       */
      this.setDefaultTooltip = function(tooltip) {
        defaults.defaultTooltip = tooltip;
        return this;
      };

      /**
       * Set default legend configuration
       * @param {Object} legend - Legend configuration
       */
      this.setDefaultLegend = function(legend) {
        defaults.legend = legend;
        return this;
      };

      /**
       * Set default toolbar configuration
       * @param {Object} toolbar - Toolbar configuration
       */
      this.setDefaultToolbar = function(toolbar) {
        defaults.toolbar = toolbar;
        return this;
      };

      this.$get = function() {
        return {
          /**
           * Get all defaults
           * @returns {Object} Default configuration
           */
          getDefaults: function() {
            return angular.copy(defaults);
          },

          /**
           * Get a specific default value
           * @param {string} key - Configuration key (supports dot notation)
           * @returns {*} Configuration value
           */
          get: function(key) {
            if (!key) {
              return angular.copy(defaults);
            }

            var parts = key.split('.');
            var value = defaults;

            for (var i = 0; i < parts.length; i++) {
              if (value === null || value === undefined) {
                return undefined;
              }
              value = value[parts[i]];
            }

            return angular.copy(value);
          },

          /**
           * Get event debounce time
           * @returns {number} Milliseconds
           */
          getEventDebounceTime: function() {
            return eventDebounceTime;
          },

          /**
           * Get update debounce time
           * @returns {number} Milliseconds
           */
          getUpdateDebounceTime: function() {
            return updateDebounceTime;
          },

          /**
           * Merge defaults with provided configuration
           * @param {Object} config - Configuration to merge
           * @returns {Object} Merged configuration
           */
          mergeWithDefaults: function(config) {
            var result = angular.copy(defaults);
            if (config) {
              angular.merge(result, config);
            }
            return result;
          }
        };
      };
    });

})(angular);

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

/**
 * JSCharting AngularJS Config Builder Service
 *
 * Provides a fluent API for building chart configurations.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .factory('jscConfigBuilder', [function() {

      /**
       * ConfigBuilder class
       * @constructor
       */
      function ConfigBuilder() {
        this.config = {};
      }

      ConfigBuilder.prototype = {
        /**
         * Set chart type
         * @param {string} type - Chart type
         * @returns {ConfigBuilder}
         */
        type: function(type) {
          this.config.type = type;
          return this;
        },

        /**
         * Set chart title
         * @param {string} text - Title text
         * @param {Object} [options] - Additional title options
         * @returns {ConfigBuilder}
         */
        title: function(text, options) {
          this.config.title = angular.extend({
            label: { text: text }
          }, options);
          return this;
        },

        /**
         * Configure X axis
         * @param {Object} options - Axis options
         * @returns {ConfigBuilder}
         */
        xAxis: function(options) {
          this.config.xAxis = options;
          return this;
        },

        /**
         * Set X axis label
         * @param {string} text - Label text
         * @returns {ConfigBuilder}
         */
        xAxisLabel: function(text) {
          this.config.xAxis = this.config.xAxis || {};
          this.config.xAxis.label = { text: text };
          return this;
        },

        /**
         * Set X axis categories
         * @param {Array} categories - Category labels
         * @returns {ConfigBuilder}
         */
        xAxisCategories: function(categories) {
          this.config.xAxis = this.config.xAxis || {};
          this.config.xAxis.categories = categories;
          return this;
        },

        /**
         * Configure Y axis
         * @param {Object} options - Axis options
         * @returns {ConfigBuilder}
         */
        yAxis: function(options) {
          this.config.yAxis = options;
          return this;
        },

        /**
         * Set Y axis label
         * @param {string} text - Label text
         * @returns {ConfigBuilder}
         */
        yAxisLabel: function(text) {
          this.config.yAxis = this.config.yAxis || {};
          this.config.yAxis.label = { text: text };
          return this;
        },

        /**
         * Set Y axis scale range
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {ConfigBuilder}
         */
        yAxisRange: function(min, max) {
          this.config.yAxis = this.config.yAxis || {};
          this.config.yAxis.scale = this.config.yAxis.scale || {};
          if (min !== undefined) this.config.yAxis.scale.min = min;
          if (max !== undefined) this.config.yAxis.scale.max = max;
          return this;
        },

        /**
         * Set series data
         * @param {Array} seriesArray - Array of series objects
         * @returns {ConfigBuilder}
         */
        series: function(seriesArray) {
          this.config.series = seriesArray;
          return this;
        },

        /**
         * Add a single series
         * @param {string} name - Series name
         * @param {Array} points - Data points
         * @param {Object} [options] - Additional series options
         * @returns {ConfigBuilder}
         */
        addSeries: function(name, points, options) {
          this.config.series = this.config.series || [];
          this.config.series.push(angular.extend({
            name: name,
            points: points
          }, options));
          return this;
        },

        /**
         * Set default series options
         * @param {Object} options - Default series configuration
         * @returns {ConfigBuilder}
         */
        defaultSeries: function(options) {
          this.config.defaultSeries = options;
          return this;
        },

        /**
         * Set default point options
         * @param {Object} options - Default point configuration
         * @returns {ConfigBuilder}
         */
        defaultPoint: function(options) {
          this.config.defaultPoint = options;
          return this;
        },

        /**
         * Configure legend
         * @param {Object|string} options - Legend options or position string
         * @returns {ConfigBuilder}
         */
        legend: function(options) {
          if (typeof options === 'string') {
            this.config.legend = { position: options };
          } else {
            this.config.legend = options;
          }
          return this;
        },

        /**
         * Hide legend
         * @returns {ConfigBuilder}
         */
        hideLegend: function() {
          this.config.legend = { visible: false };
          return this;
        },

        /**
         * Set palette
         * @param {string|Array} palette - Palette name or array of colors
         * @returns {ConfigBuilder}
         */
        palette: function(palette) {
          this.config.palette = palette;
          return this;
        },

        /**
         * Set smart palette for data-driven coloring
         * @param {Object} options - Smart palette options
         * @returns {ConfigBuilder}
         */
        smartPalette: function(options) {
          this.config.palette = options;
          return this;
        },

        /**
         * Configure tooltip
         * @param {Object|string} options - Tooltip options or template string
         * @returns {ConfigBuilder}
         */
        tooltip: function(options) {
          if (typeof options === 'string') {
            this.config.defaultTooltip = { label: { text: options } };
          } else {
            this.config.defaultTooltip = options;
          }
          return this;
        },

        /**
         * Configure toolbar
         * @param {Object} options - Toolbar options
         * @returns {ConfigBuilder}
         */
        toolbar: function(options) {
          this.config.toolbar = options;
          return this;
        },

        /**
         * Enable or disable export
         * @param {boolean} enabled - Enable export
         * @returns {ConfigBuilder}
         */
        export: function(enabled) {
          this.config.export = enabled;
          return this;
        },

        /**
         * Configure animation
         * @param {Object|number} options - Animation options or duration
         * @returns {ConfigBuilder}
         */
        animation: function(options) {
          if (typeof options === 'number') {
            this.config.animation = { duration: options };
          } else {
            this.config.animation = options;
          }
          return this;
        },

        /**
         * Disable animation
         * @returns {ConfigBuilder}
         */
        noAnimation: function() {
          this.config.animation = { duration: 0 };
          return this;
        },

        /**
         * Set debug mode
         * @param {boolean} enabled
         * @returns {ConfigBuilder}
         */
        debug: function(enabled) {
          this.config.debug = enabled !== false;
          return this;
        },

        /**
         * Set chart dimensions
         * @param {number|string} width - Width in pixels or percentage
         * @param {number|string} height - Height in pixels or percentage
         * @returns {ConfigBuilder}
         */
        size: function(width, height) {
          if (width) this.config.width = width;
          if (height) this.config.height = height;
          return this;
        },

        /**
         * Set chart margin
         * @param {number|Object} margin - Margin value or object
         * @returns {ConfigBuilder}
         */
        margin: function(margin) {
          if (typeof margin === 'number') {
            this.config.margin = margin;
          } else {
            this.config.margin = margin;
          }
          return this;
        },

        /**
         * Configure zoom behavior
         * @param {string} axis - Axis to zoom ('x', 'y', 'xy', 'none')
         * @returns {ConfigBuilder}
         */
        zoom: function(axis) {
          this.config.axisToZoom = axis;
          return this;
        },

        /**
         * Add annotations
         * @param {Array} annotations - Array of annotation objects
         * @returns {ConfigBuilder}
         */
        annotations: function(annotations) {
          this.config.annotations = annotations;
          return this;
        },

        /**
         * Add a single annotation
         * @param {Object} annotation - Annotation object
         * @returns {ConfigBuilder}
         */
        addAnnotation: function(annotation) {
          this.config.annotations = this.config.annotations || [];
          this.config.annotations.push(annotation);
          return this;
        },

        /**
         * Configure mapping options (for map charts)
         * @param {Object} options - Mapping options
         * @returns {ConfigBuilder}
         */
        mapping: function(options) {
          this.config.mapping = options;
          return this;
        },

        /**
         * Configure calendar options (for calendar charts)
         * @param {Object} options - Calendar options
         * @returns {ConfigBuilder}
         */
        calendar: function(options) {
          this.config.calendar = options;
          return this;
        },

        /**
         * Configure grid options (for data grid)
         * @param {Object} options - Grid options
         * @returns {ConfigBuilder}
         */
        grid: function(options) {
          this.config.grid = options;
          return this;
        },

        /**
         * Set chart events
         * @param {Object} events - Event handlers
         * @returns {ConfigBuilder}
         */
        events: function(events) {
          this.config.events = events;
          return this;
        },

        /**
         * Add a single event handler
         * @param {string} eventName - Event name
         * @param {Function} handler - Event handler
         * @returns {ConfigBuilder}
         */
        on: function(eventName, handler) {
          this.config.events = this.config.events || {};
          this.config.events[eventName] = handler;
          return this;
        },

        /**
         * Set point click handler
         * @param {Function} handler - Click handler
         * @returns {ConfigBuilder}
         */
        onPointClick: function(handler) {
          this.config.defaultPoint = this.config.defaultPoint || {};
          this.config.defaultPoint.events = this.config.defaultPoint.events || {};
          this.config.defaultPoint.events.click = handler;
          return this;
        },

        /**
         * Merge additional options
         * @param {Object} options - Options to merge
         * @returns {ConfigBuilder}
         */
        extend: function(options) {
          angular.merge(this.config, options);
          return this;
        },

        /**
         * Apply a template configuration
         * @param {Object} template - Template configuration
         * @returns {ConfigBuilder}
         */
        template: function(template) {
          this.config.template = template;
          return this;
        },

        /**
         * Build and return the configuration
         * @returns {Object} Chart configuration
         */
        build: function() {
          return angular.copy(this.config);
        },

        /**
         * Reset the builder
         * @returns {ConfigBuilder}
         */
        reset: function() {
          this.config = {};
          return this;
        }
      };

      return {
        /**
         * Create a new configuration builder
         * @returns {ConfigBuilder}
         */
        create: function() {
          return new ConfigBuilder();
        },

        /**
         * Create a builder initialized with existing config
         * @param {Object} config - Initial configuration
         * @returns {ConfigBuilder}
         */
        from: function(config) {
          var builder = new ConfigBuilder();
          builder.config = angular.copy(config) || {};
          return builder;
        }
      };
    }]);

})(angular);

/**
 * JSCharting AngularJS Event Service
 *
 * Provides cross-chart event communication and event bridging
 * between JSCharting events and Angular scope.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .factory('jscEventService', ['$rootScope', '$timeout', function($rootScope, $timeout) {

      // Event prefix for all JSCharting events
      var EVENT_PREFIX = 'jsc:';

      // Map of JSCharting event names to Angular callback attribute names
      var EVENT_MAP = {
        // Chart-level events
        chart: {
          'load': 'jscOnLoad',
          'redraw': 'jscOnRedraw',
          'click': 'jscOnClick',
          'selection': 'jscOnSelection',
          'selecting': 'jscOnSelecting',
          'zoomed': 'jscOnZoomed',
          'scrolled': 'jscOnScrolled',
          'mouseOver': 'jscOnMouseOver',
          'mouseOut': 'jscOnMouseOut',
          'pointSelectionChanged': 'jscOnPointSelectionChanged',
          'seriesSelectionChanged': 'jscOnSeriesSelectionChanged',
          'beforeExport': 'jscOnBeforeExport',
          'afterExport': 'jscOnAfterExport'
        },
        // Point-level events
        point: {
          'click': 'jscOnPointClick',
          'mouseOver': 'jscOnPointMouseOver',
          'mouseOut': 'jscOnPointMouseOut',
          'select': 'jscOnPointSelect',
          'unselect': 'jscOnPointUnselect'
        },
        // Series-level events
        series: {
          'click': 'jscOnSeriesClick',
          'mouseOver': 'jscOnSeriesMouseOver',
          'mouseOut': 'jscOnSeriesMouseOut',
          'show': 'jscOnSeriesShow',
          'hide': 'jscOnSeriesHide'
        },
        // Legend entry events
        legendEntry: {
          'click': 'jscOnLegendClick',
          'mouseOver': 'jscOnLegendMouseOver',
          'mouseOut': 'jscOnLegendMouseOut'
        },
        // Axis tick events
        axisTick: {
          'click': 'jscOnAxisTickClick',
          'mouseOver': 'jscOnAxisTickMouseOver',
          'mouseOut': 'jscOnAxisTickMouseOut'
        },
        // UI item events
        uiItem: {
          'click': 'jscOnUiItemClick',
          'change': 'jscOnUiItemChange'
        }
      };

      return {
        /**
         * Get the event map
         * @returns {Object}
         */
        getEventMap: function() {
          return angular.copy(EVENT_MAP);
        },

        /**
         * Get the event prefix
         * @returns {string}
         */
        getEventPrefix: function() {
          return EVENT_PREFIX;
        },

        /**
         * Subscribe to a JSCharting event at the application level.
         *
         * IMPORTANT: To prevent memory leaks, either:
         * 1. Provide a scope for automatic cleanup (recommended), or
         * 2. Manually call the returned unbind function when done
         *
         * @param {string} eventName - Event name (without prefix)
         * @param {Function} callback - Event callback
         * @param {Object} [scope] - Scope for auto-cleanup (STRONGLY RECOMMENDED)
         * @returns {Function} Unsubscribe function - MUST be called if no scope provided
         */
        on: function(eventName, callback, scope) {
          if (!scope) {
            console.warn('[jscEventService] on() called without scope parameter. ' +
              'To prevent memory leaks, either pass a scope or manually call the returned unbind function.');
          }

          var unbind = $rootScope.$on(EVENT_PREFIX + eventName, function(event, data) {
            callback(data);
          });

          // Auto-cleanup when scope is destroyed
          if (scope && scope.$on) {
            scope.$on('$destroy', unbind);
          }

          return unbind;
        },

        /**
         * Emit a JSCharting event
         *
         * @param {string} eventName - Event name (without prefix)
         * @param {Object} data - Event data
         */
        emit: function(eventName, data) {
          $timeout(function() {
            $rootScope.$emit(EVENT_PREFIX + eventName, data);
          });
        },

        /**
         * Broadcast a JSCharting event (propagates down)
         *
         * @param {string} eventName - Event name (without prefix)
         * @param {Object} data - Event data
         */
        broadcast: function(eventName, data) {
          $timeout(function() {
            $rootScope.$broadcast(EVENT_PREFIX + eventName, data);
          });
        },

        /**
         * Create an event wrapper that bridges JSCharting events to Angular
         *
         * @param {Function} callback - Angular callback function
         * @param {Object} chart - Chart instance
         * @param {string} [eventType] - Event type for context
         * @returns {Function} Wrapped callback
         */
        wrapCallback: function(callback, chart, eventType) {
          return function(jscEvent) {
            $timeout(function() {
              callback({
                event: jscEvent,
                chart: chart,
                type: eventType,
                timestamp: Date.now()
              });
            });
          };
        },

        /**
         * Create point event wrapper
         *
         * @param {Function} callback - Angular callback function
         * @param {Object} chart - Chart instance
         * @returns {Function} Wrapped callback
         */
        wrapPointCallback: function(callback, chart) {
          return function(jscEvent) {
            var point = this;
            $timeout(function() {
              callback({
                event: jscEvent,
                point: point,
                chart: chart,
                timestamp: Date.now()
              });
            });
          };
        },

        /**
         * Create series event wrapper
         *
         * @param {Function} callback - Angular callback function
         * @param {Object} chart - Chart instance
         * @returns {Function} Wrapped callback
         */
        wrapSeriesCallback: function(callback, chart) {
          return function(jscEvent) {
            var series = this;
            $timeout(function() {
              callback({
                event: jscEvent,
                series: series,
                chart: chart,
                timestamp: Date.now()
              });
            });
          };
        },

        /**
         * Wire chart events from scope to config
         *
         * @param {Object} config - Chart configuration
         * @param {Object} scope - Directive scope
         * @param {Object} chart - Chart instance (can be null initially)
         * @returns {Object} Modified config
         */
        wireChartEvents: function(config, scope, chart) {
          var self = this;
          config.events = config.events || {};

          angular.forEach(EVENT_MAP.chart, function(scopeAttr, jscEvent) {
            if (scope[scopeAttr]) {
              config.events[jscEvent] = self.wrapCallback(scope[scopeAttr], chart, jscEvent);
            }
          });

          return config;
        },

        /**
         * Wire point events from scope to config
         *
         * @param {Object} config - Chart configuration
         * @param {Object} scope - Directive scope
         * @param {Object} chart - Chart instance
         * @returns {Object} Modified config
         */
        wirePointEvents: function(config, scope, chart) {
          var self = this;
          config.defaultPoint = config.defaultPoint || {};
          config.defaultPoint.events = config.defaultPoint.events || {};

          angular.forEach(EVENT_MAP.point, function(scopeAttr, jscEvent) {
            if (scope[scopeAttr]) {
              config.defaultPoint.events[jscEvent] = self.wrapPointCallback(scope[scopeAttr], chart);
            }
          });

          return config;
        },

        /**
         * Wire series events from scope to config
         *
         * @param {Object} config - Chart configuration
         * @param {Object} scope - Directive scope
         * @param {Object} chart - Chart instance
         * @returns {Object} Modified config
         */
        wireSeriesEvents: function(config, scope, chart) {
          var self = this;
          config.defaultSeries = config.defaultSeries || {};
          config.defaultSeries.events = config.defaultSeries.events || {};

          angular.forEach(EVENT_MAP.series, function(scopeAttr, jscEvent) {
            if (scope[scopeAttr]) {
              config.defaultSeries.events[jscEvent] = self.wrapSeriesCallback(scope[scopeAttr], chart);
            }
          });

          return config;
        },

        /**
         * Wire legend events from scope to config
         *
         * @param {Object} config - Chart configuration
         * @param {Object} scope - Directive scope
         * @param {Object} chart - Chart instance
         * @returns {Object} Modified config
         */
        wireLegendEvents: function(config, scope, chart) {
          var self = this;

          if (scope.jscOnLegendClick || scope.jscOnLegendMouseOver || scope.jscOnLegendMouseOut) {
            config.legend = config.legend || {};
            config.legend.defaultEntry = config.legend.defaultEntry || {};
            config.legend.defaultEntry.events = config.legend.defaultEntry.events || {};

            angular.forEach(EVENT_MAP.legendEntry, function(scopeAttr, jscEvent) {
              if (scope[scopeAttr]) {
                config.legend.defaultEntry.events[jscEvent] = self.wrapCallback(scope[scopeAttr], chart, jscEvent);
              }
            });
          }

          return config;
        },

        /**
         * Wire all events from scope to config
         *
         * @param {Object} config - Chart configuration
         * @param {Object} scope - Directive scope
         * @param {Object} chart - Chart instance
         * @returns {Object} Modified config
         */
        wireAllEvents: function(config, scope, chart) {
          this.wireChartEvents(config, scope, chart);
          this.wirePointEvents(config, scope, chart);
          this.wireSeriesEvents(config, scope, chart);
          this.wireLegendEvents(config, scope, chart);
          return config;
        }
      };
    }]);

})(angular);

/**
 * JSCharting AngularJS Chart Directive
 *
 * Main directive for rendering JSCharting charts.
 * Supports all 150+ chart types through the jsc-type attribute.
 *
 * Usage:
 *   <jsc-chart
 *     jsc-options="vm.chartOptions"
 *     jsc-series="vm.seriesData"
 *     jsc-type="line"
 *     jsc-on-load="vm.onChartLoad(chart)"
 *     jsc-on-point-click="vm.onPointClick(point, event)"
 *     jsc-instance="vm.chart">
 *   </jsc-chart>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .directive('jscChart', [
      '$timeout',
      'jscChartFactory',
      'jscConfig',
      'jscEventService',
      'jscPerformance',
      'jscModuleLoader',
      function($timeout, jscChartFactory, jscConfig, jscEventService, jscPerformance, jscModuleLoader) {

        return {
          restrict: 'EA',
          scope: {
            // One-way bindings for configuration (read-only from parent)
            options: '<?jscOptions',
            series: '<?jscSeries',
            muted: '<?jscMuted',

            // Two-way binding for instance output
            chartInstance: '=?jscInstance',

            // One-way bindings (read-only from parent)
            type: '@?jscType',
            palette: '<?jscPalette',
            debug: '<?jscDebug',
            animation: '<?jscAnimation',
            title: '@?jscTitle',
            legendPosition: '@?jscLegendPosition',
            axisToZoom: '@?jscAxisToZoom',
            width: '@?jscWidth',
            height: '@?jscHeight',

            // Chart event callbacks
            onLoad: '&?jscOnLoad',
            onRedraw: '&?jscOnRedraw',
            onClick: '&?jscOnClick',
            onSelection: '&?jscOnSelection',
            onSelecting: '&?jscOnSelecting',
            onZoomed: '&?jscOnZoomed',
            onScrolled: '&?jscOnScrolled',
            onMouseOver: '&?jscOnMouseOver',
            onMouseOut: '&?jscOnMouseOut',
            onPointSelectionChanged: '&?jscOnPointSelectionChanged',
            onSeriesSelectionChanged: '&?jscOnSeriesSelectionChanged',
            onBeforeExport: '&?jscOnBeforeExport',
            onAfterExport: '&?jscOnAfterExport',

            // Point event callbacks
            onPointClick: '&?jscOnPointClick',
            onPointMouseOver: '&?jscOnPointMouseOver',
            onPointMouseOut: '&?jscOnPointMouseOut',
            onPointSelect: '&?jscOnPointSelect',
            onPointUnselect: '&?jscOnPointUnselect',

            // Series event callbacks
            onSeriesClick: '&?jscOnSeriesClick',
            onSeriesMouseOver: '&?jscOnSeriesMouseOver',
            onSeriesMouseOut: '&?jscOnSeriesMouseOut',
            onSeriesShow: '&?jscOnSeriesShow',
            onSeriesHide: '&?jscOnSeriesHide',

            // Legend event callbacks
            onLegendClick: '&?jscOnLegendClick',
            onLegendMouseOver: '&?jscOnLegendMouseOver',
            onLegendMouseOut: '&?jscOnLegendMouseOut',

            // Axis tick event callbacks
            onAxisTickClick: '&?jscOnAxisTickClick',
            onAxisTickMouseOver: '&?jscOnAxisTickMouseOver',
            onAxisTickMouseOut: '&?jscOnAxisTickMouseOut'
          },

          link: function(scope, element, attrs) {
            var chart = null;
            var debounceTimeout = null;
            var isInitialized = false;
            var pendingUpdate = null;
            var initializationInProgress = false;
            var lastOptionsHash = null;
            var lastSeriesHash = null;

            // Get debounce time from config
            var updateDebounceTime = jscConfig.getUpdateDebounceTime();
            var eventDebounceTime = jscConfig.getEventDebounceTime();

            /**
             * Build chart configuration from scope bindings
             */
            function buildConfig() {
              // Start with options or empty object
              var config = angular.copy(scope.options) || {};

              // Apply individual attribute bindings (higher priority)
              if (scope.type) {
                config.type = scope.type;
              }
              if (scope.series) {
                config.series = angular.copy(scope.series);
              }
              if (scope.palette !== undefined) {
                config.palette = scope.palette;
              }
              if (scope.debug !== undefined) {
                config.debug = scope.debug;
              }
              if (scope.animation !== undefined) {
                config.animation = scope.animation;
              }
              if (scope.title) {
                config.title = config.title || {};
                config.title.label = config.title.label || {};
                config.title.label.text = scope.title;
              }
              if (scope.legendPosition) {
                config.legend = config.legend || {};
                config.legend.position = scope.legendPosition;
              }
              if (scope.axisToZoom) {
                config.axisToZoom = scope.axisToZoom;
              }
              if (scope.width) {
                config.width = scope.width;
              }
              if (scope.height) {
                config.height = scope.height;
              }
              if (scope.muted !== undefined) {
                config.muted = scope.muted;
              }

              // Wire event callbacks
              wireEvents(config);

              return config;
            }

            /**
             * Wire event callbacks from scope to config
             */
            function wireEvents(config) {
              config.events = config.events || {};

              // Chart events
              if (scope.onRedraw) {
                config.events.redraw = function(e) {
                  $timeout(function() {
                    scope.onRedraw({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onClick) {
                config.events.click = function(e) {
                  $timeout(function() {
                    scope.onClick({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onSelection) {
                config.events.selection = function(e) {
                  $timeout(function() {
                    scope.onSelection({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onSelecting) {
                config.events.selecting = function(e) {
                  $timeout(function() {
                    scope.onSelecting({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onZoomed) {
                config.events.zoomed = function(e) {
                  $timeout(function() {
                    scope.onZoomed({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onScrolled) {
                config.events.scrolled = function(e) {
                  $timeout(function() {
                    scope.onScrolled({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onMouseOver) {
                config.events.mouseOver = function(e) {
                  $timeout(function() {
                    scope.onMouseOver({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onMouseOut) {
                config.events.mouseOut = function(e) {
                  $timeout(function() {
                    scope.onMouseOut({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onPointSelectionChanged) {
                config.events.pointSelectionChanged = function(points) {
                  $timeout(function() {
                    scope.onPointSelectionChanged({ points: points, chart: chart });
                  });
                };
              }
              if (scope.onSeriesSelectionChanged) {
                config.events.seriesSelectionChanged = function(series) {
                  $timeout(function() {
                    scope.onSeriesSelectionChanged({ series: series, chart: chart });
                  });
                };
              }
              if (scope.onBeforeExport) {
                config.events.beforeExport = function(e) {
                  $timeout(function() {
                    scope.onBeforeExport({ event: e, chart: chart });
                  });
                };
              }
              if (scope.onAfterExport) {
                config.events.afterExport = function(e) {
                  $timeout(function() {
                    scope.onAfterExport({ event: e, chart: chart });
                  });
                };
              }

              // Point events
              if (scope.onPointClick || scope.onPointMouseOver || scope.onPointMouseOut ||
                  scope.onPointSelect || scope.onPointUnselect) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.events = config.defaultPoint.events || {};

                if (scope.onPointClick) {
                  config.defaultPoint.events.click = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointClick({ event: e, point: point, chart: chart });
                    });
                  };
                }
                if (scope.onPointMouseOver) {
                  config.defaultPoint.events.mouseOver = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOver({ event: e, point: point, chart: chart });
                    });
                  };
                }
                if (scope.onPointMouseOut) {
                  config.defaultPoint.events.mouseOut = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOut({ event: e, point: point, chart: chart });
                    });
                  };
                }
                if (scope.onPointSelect) {
                  config.defaultPoint.events.select = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointSelect({ event: e, point: point, chart: chart });
                    });
                  };
                }
                if (scope.onPointUnselect) {
                  config.defaultPoint.events.unselect = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointUnselect({ event: e, point: point, chart: chart });
                    });
                  };
                }
              }

              // Series events
              if (scope.onSeriesClick || scope.onSeriesMouseOver || scope.onSeriesMouseOut ||
                  scope.onSeriesShow || scope.onSeriesHide) {
                config.defaultSeries = config.defaultSeries || {};
                config.defaultSeries.events = config.defaultSeries.events || {};

                if (scope.onSeriesClick) {
                  config.defaultSeries.events.click = function(e) {
                    var series = this;
                    $timeout(function() {
                      scope.onSeriesClick({ event: e, series: series, chart: chart });
                    });
                  };
                }
                if (scope.onSeriesMouseOver) {
                  config.defaultSeries.events.mouseOver = function(e) {
                    var series = this;
                    $timeout(function() {
                      scope.onSeriesMouseOver({ event: e, series: series, chart: chart });
                    });
                  };
                }
                if (scope.onSeriesMouseOut) {
                  config.defaultSeries.events.mouseOut = function(e) {
                    var series = this;
                    $timeout(function() {
                      scope.onSeriesMouseOut({ event: e, series: series, chart: chart });
                    });
                  };
                }
                if (scope.onSeriesShow) {
                  config.defaultSeries.events.show = function(e) {
                    var series = this;
                    $timeout(function() {
                      scope.onSeriesShow({ event: e, series: series, chart: chart });
                    });
                  };
                }
                if (scope.onSeriesHide) {
                  config.defaultSeries.events.hide = function(e) {
                    var series = this;
                    $timeout(function() {
                      scope.onSeriesHide({ event: e, series: series, chart: chart });
                    });
                  };
                }
              }

              // Legend events
              if (scope.onLegendClick || scope.onLegendMouseOver || scope.onLegendMouseOut) {
                config.legend = config.legend || {};
                config.legend.defaultEntry = config.legend.defaultEntry || {};
                config.legend.defaultEntry.events = config.legend.defaultEntry.events || {};

                if (scope.onLegendClick) {
                  config.legend.defaultEntry.events.click = function(e) {
                    $timeout(function() {
                      scope.onLegendClick({ event: e, chart: chart });
                    });
                  };
                }
                if (scope.onLegendMouseOver) {
                  config.legend.defaultEntry.events.mouseOver = function(e) {
                    $timeout(function() {
                      scope.onLegendMouseOver({ event: e, chart: chart });
                    });
                  };
                }
                if (scope.onLegendMouseOut) {
                  config.legend.defaultEntry.events.mouseOut = function(e) {
                    $timeout(function() {
                      scope.onLegendMouseOut({ event: e, chart: chart });
                    });
                  };
                }
              }

              // Axis tick events
              if (scope.onAxisTickClick || scope.onAxisTickMouseOver || scope.onAxisTickMouseOut) {
                config.xAxis = config.xAxis || {};
                config.xAxis.defaultTick = config.xAxis.defaultTick || {};
                config.xAxis.defaultTick.events = config.xAxis.defaultTick.events || {};

                if (scope.onAxisTickClick) {
                  config.xAxis.defaultTick.events.click = function(e) {
                    $timeout(function() {
                      scope.onAxisTickClick({ event: e, chart: chart });
                    });
                  };
                }
                if (scope.onAxisTickMouseOver) {
                  config.xAxis.defaultTick.events.mouseOver = function(e) {
                    $timeout(function() {
                      scope.onAxisTickMouseOver({ event: e, chart: chart });
                    });
                  };
                }
                if (scope.onAxisTickMouseOut) {
                  config.xAxis.defaultTick.events.mouseOut = function(e) {
                    $timeout(function() {
                      scope.onAxisTickMouseOut({ event: e, chart: chart });
                    });
                  };
                }
              }
            }

            /**
             * Initialize the chart
             */
            function initChart() {
              // Prevent concurrent initialization
              if (initializationInProgress) {
                return;
              }
              initializationInProgress = true;

              var config = buildConfig();

              // Store hashes for efficient change detection
              lastOptionsHash = jscPerformance.computeHash(scope.options);
              lastSeriesHash = jscPerformance.computeHash(scope.series);

              // Load required modules first
              jscModuleLoader.loadForType(config.type).then(function() {
                // Check if we were destroyed while loading
                if (!element || !element[0]) {
                  initializationInProgress = false;
                  return;
                }

                chart = jscChartFactory.createSync(element[0], config, function(chartInstance) {
                  // Chart is fully loaded
                  $timeout(function() {
                    // Only set if still valid
                    if (chart === chartInstance) {
                      scope.chartInstance = chartInstance;
                      isInitialized = true;
                      initializationInProgress = false;

                      if (scope.onLoad) {
                        scope.onLoad({ chart: chartInstance });
                      }

                      // Process any pending updates
                      if (pendingUpdate) {
                        updateChart(pendingUpdate);
                        pendingUpdate = null;
                      }
                    }
                  });
                });
              }).catch(function(error) {
                console.error('Failed to load chart modules:', error);
                initializationInProgress = false;
              });
            }

            /**
             * Update the chart with new options
             */
            function updateChart(newConfig) {
              if (!chart) {
                pendingUpdate = newConfig;
                return;
              }

              try {
                chart.options(newConfig);
              } catch (e) {
                console.warn('Error updating chart:', e);
              }
            }

            /**
             * Schedule a debounced update
             */
            function scheduleUpdate() {
              if (debounceTimeout) {
                $timeout.cancel(debounceTimeout);
              }

              debounceTimeout = $timeout(function() {
                var config = buildConfig();
                updateChart(config);
              }, updateDebounceTime);
            }

            // Watch for options changes using hash-based comparison for efficiency
            scope.$watch('options', function(newVal, oldVal) {
              if (!isInitialized) return;

              // Use hash comparison instead of deep watch for better performance
              var newHash = jscPerformance.computeHash(newVal);
              if (newHash !== lastOptionsHash) {
                lastOptionsHash = newHash;
                scheduleUpdate();
              }
            }, true);

            // Watch for series changes using hash-based comparison
            scope.$watch('series', function(newVal, oldVal) {
              if (!isInitialized || !chart) return;

              var newHash = jscPerformance.computeHash(newVal);
              if (newHash !== lastSeriesHash) {
                lastSeriesHash = newHash;
                if (debounceTimeout) {
                  $timeout.cancel(debounceTimeout);
                }
                debounceTimeout = $timeout(function() {
                  // Use shallow copy for series to avoid expensive deep copy
                  chart.options({ series: newVal ? newVal.slice() : [] });
                }, updateDebounceTime);
              }
            }, true);

            // Watch for type changes (requires full rebuild)
            scope.$watch('type', function(newVal, oldVal) {
              if (newVal !== oldVal && isInitialized && !initializationInProgress) {
                // Type change requires reinitializing the chart
                if (chart) {
                  jscChartFactory.destroy(chart);
                  chart = null;
                  scope.chartInstance = null;
                  isInitialized = false;
                }
                initChart();
              }
            });

            // Watch for palette changes
            scope.$watch('palette', function(newVal, oldVal) {
              if (newVal !== oldVal && chart) {
                chart.options({ palette: newVal });
              }
            });

            // Watch for muted state changes
            scope.$watch('muted', function(newVal, oldVal) {
              if (newVal !== oldVal && chart) {
                chart.options({ muted: newVal });
              }
            });

            // Cleanup on destroy
            scope.$on('$destroy', function() {
              if (debounceTimeout) {
                $timeout.cancel(debounceTimeout);
              }

              if (chart) {
                jscChartFactory.destroy(chart);
                chart = null;
              }

              scope.chartInstance = null;
              isInitialized = false;
            });

            // Initialize chart
            initChart();
          }
        };
      }
    ]);

})(angular);

/**
 * JSCharting AngularJS Widgets Module
 *
 * Provides widget directives for gauge and micro-chart displays.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.widgets', ['jsc.angular.core']);

})(angular);

/**
 * JSCharting AngularJS Linear Widget Directive
 *
 * Displays a linear gauge/progress indicator.
 *
 * Usage:
 *   <jsc-linear-widget
 *     jsc-value="vm.currentValue"
 *     jsc-min="0"
 *     jsc-max="100"
 *     jsc-label="'Progress'"
 *     jsc-color="'#4CAF50'"
 *     jsc-target="80"
 *     jsc-prev-value="vm.previousValue"
 *     jsc-instance="vm.widget">
 *   </jsc-linear-widget>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.widgets')
    .directive('jscLinearWidget', ['$timeout', function($timeout) {

      return {
        restrict: 'EA',
        scope: {
          value: '=jscValue',
          label: '<?jscLabel',
          icon: '@?jscIcon',
          min: '<?jscMin',
          max: '<?jscMax',
          color: '@?jscColor',
          target: '<?jscTarget',
          prevValue: '<?jscPrevValue',
          options: '<?jscOptions',
          orientation: '@?jscOrientation',
          showValue: '<?jscShowValue',
          format: '@?jscFormat',
          widgetInstance: '=?jscInstance'
        },

        link: function(scope, element, attrs) {
          var widget = null;
          var isInitialized = false;

          /**
           * Check if JSCWidgets is available
           */
          function isWidgetsAvailable() {
            return typeof JSCWidgets !== 'undefined' && typeof JSCWidgets.Linear === 'function';
          }

          /**
           * Build widget configuration
           */
          function buildConfig() {
            var config = angular.extend({}, scope.options);

            // Apply scope bindings
            if (scope.value !== undefined) config.value = scope.value;
            if (scope.label !== undefined) config.label = scope.label;
            if (scope.icon) config.icon = scope.icon;
            if (scope.min !== undefined) config.min = scope.min;
            if (scope.max !== undefined) config.max = scope.max;
            if (scope.color) config.color = scope.color;
            if (scope.target !== undefined) config.target = scope.target;
            if (scope.prevValue !== undefined) config.prevValue = scope.prevValue;
            if (scope.orientation) config.orientation = scope.orientation;
            if (scope.showValue !== undefined) config.showValue = scope.showValue;
            if (scope.format) config.format = scope.format;

            return config;
          }

          /**
           * Create the widget
           */
          function createWidget() {
            if (!isWidgetsAvailable()) {
              console.error('JSCWidgets.Linear is not available. Include jscharting-widgets.js.');
              return;
            }

            var config = buildConfig();

            try {
              widget = new JSCWidgets.Linear(element[0], config, function() {
                $timeout(function() {
                  scope.widgetInstance = widget;
                  isInitialized = true;
                });
              });
            } catch (e) {
              console.error('Error creating Linear widget:', e);
            }
          }

          /**
           * Update the widget
           */
          function updateWidget(options) {
            if (widget && typeof widget.options === 'function') {
              try {
                widget.options(options);
              } catch (e) {
                console.warn('Error updating Linear widget:', e);
              }
            }
          }

          // Watch for value changes
          scope.$watch('value', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({
                value: newVal,
                prevValue: scope.prevValue
              });
            }
          });

          // Watch for target changes
          scope.$watch('target', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ target: newVal });
            }
          });

          // Watch for prevValue changes
          scope.$watch('prevValue', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ prevValue: newVal });
            }
          });

          // Watch for label changes
          scope.$watch('label', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ label: newVal });
            }
          });

          // Watch for color changes
          scope.$watch('color', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ color: newVal });
            }
          });

          // Cleanup
          scope.$on('$destroy', function() {
            if (widget && typeof widget.destroy === 'function') {
              widget.destroy();
            }
            widget = null;
            scope.widgetInstance = null;
          });

          // Initialize
          createWidget();
        }
      };
    }]);

})(angular);

/**
 * JSCharting AngularJS Circular Widget Directive
 *
 * Displays a circular gauge/progress indicator.
 *
 * Usage:
 *   <jsc-circular-widget
 *     jsc-value="vm.progress"
 *     jsc-min="0"
 *     jsc-max="100"
 *     jsc-label="'Completion'"
 *     jsc-color="'#2196F3'"
 *     jsc-sweep="270"
 *     jsc-instance="vm.gauge">
 *   </jsc-circular-widget>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.widgets')
    .directive('jscCircularWidget', ['$timeout', function($timeout) {

      return {
        restrict: 'EA',
        scope: {
          value: '=jscValue',
          label: '<?jscLabel',
          icon: '@?jscIcon',
          min: '<?jscMin',
          max: '<?jscMax',
          color: '@?jscColor',
          sweep: '<?jscSweep',
          target: '<?jscTarget',
          prevValue: '<?jscPrevValue',
          options: '<?jscOptions',
          innerRadius: '<?jscInnerRadius',
          startAngle: '<?jscStartAngle',
          showValue: '<?jscShowValue',
          format: '@?jscFormat',
          widgetInstance: '=?jscInstance'
        },

        link: function(scope, element, attrs) {
          var widget = null;
          var isInitialized = false;

          /**
           * Check if JSCWidgets is available
           */
          function isWidgetsAvailable() {
            return typeof JSCWidgets !== 'undefined' && typeof JSCWidgets.Circular === 'function';
          }

          /**
           * Build widget configuration
           */
          function buildConfig() {
            var config = angular.extend({}, scope.options);

            // Apply scope bindings
            if (scope.value !== undefined) config.value = scope.value;
            if (scope.label !== undefined) config.label = scope.label;
            if (scope.icon) config.icon = scope.icon;
            if (scope.min !== undefined) config.min = scope.min;
            if (scope.max !== undefined) config.max = scope.max;
            if (scope.color) config.color = scope.color;
            if (scope.sweep !== undefined) config.sweep = scope.sweep;
            if (scope.target !== undefined) config.target = scope.target;
            if (scope.prevValue !== undefined) config.prevValue = scope.prevValue;
            if (scope.innerRadius !== undefined) config.innerRadius = scope.innerRadius;
            if (scope.startAngle !== undefined) config.startAngle = scope.startAngle;
            if (scope.showValue !== undefined) config.showValue = scope.showValue;
            if (scope.format) config.format = scope.format;

            return config;
          }

          /**
           * Create the widget
           */
          function createWidget() {
            if (!isWidgetsAvailable()) {
              console.error('JSCWidgets.Circular is not available. Include jscharting-widgets.js.');
              return;
            }

            var config = buildConfig();

            try {
              widget = new JSCWidgets.Circular(element[0], config, function() {
                $timeout(function() {
                  scope.widgetInstance = widget;
                  isInitialized = true;
                });
              });
            } catch (e) {
              console.error('Error creating Circular widget:', e);
            }
          }

          /**
           * Update the widget
           */
          function updateWidget(options) {
            if (widget && typeof widget.options === 'function') {
              try {
                widget.options(options);
              } catch (e) {
                console.warn('Error updating Circular widget:', e);
              }
            }
          }

          // Watch for value changes
          scope.$watch('value', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({
                value: newVal,
                prevValue: scope.prevValue
              });
            }
          });

          // Watch for target changes
          scope.$watch('target', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ target: newVal });
            }
          });

          // Watch for prevValue changes
          scope.$watch('prevValue', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ prevValue: newVal });
            }
          });

          // Watch for label changes
          scope.$watch('label', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ label: newVal });
            }
          });

          // Watch for color changes
          scope.$watch('color', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ color: newVal });
            }
          });

          // Watch for sweep changes
          scope.$watch('sweep', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ sweep: newVal });
            }
          });

          // Cleanup
          scope.$on('$destroy', function() {
            if (widget && typeof widget.destroy === 'function') {
              widget.destroy();
            }
            widget = null;
            scope.widgetInstance = null;
          });

          // Initialize
          createWidget();
        }
      };
    }]);

})(angular);

/**
 * JSCharting AngularJS Bar/Column Widget Directive
 *
 * Displays a bar or column micro-chart widget.
 *
 * Usage:
 *   <jsc-bar-column-widget
 *     jsc-value="vm.values"
 *     jsc-min="0"
 *     jsc-max="100"
 *     jsc-color="'#FF5722'"
 *     jsc-horizontal="true"
 *     jsc-instance="vm.widget">
 *   </jsc-bar-column-widget>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.widgets')
    .directive('jscBarColumnWidget', ['$timeout', function($timeout) {

      return {
        restrict: 'EA',
        scope: {
          value: '=jscValue',
          label: '<?jscLabel',
          min: '<?jscMin',
          max: '<?jscMax',
          color: '@?jscColor',
          horizontal: '<?jscHorizontal',
          yAxis: '<?jscYAxis',
          options: '<?jscOptions',
          showValue: '<?jscShowValue',
          format: '@?jscFormat',
          widgetInstance: '=?jscInstance'
        },

        link: function(scope, element, attrs) {
          var widget = null;
          var isInitialized = false;

          /**
           * Check if JSCWidgets is available
           */
          function isWidgetsAvailable() {
            return typeof JSCWidgets !== 'undefined' && typeof JSCWidgets.BarColumn === 'function';
          }

          /**
           * Build widget configuration
           */
          function buildConfig() {
            var config = angular.extend({}, scope.options);

            // Apply scope bindings
            if (scope.value !== undefined) config.value = scope.value;
            if (scope.label !== undefined) config.label = scope.label;
            if (scope.min !== undefined) config.min = scope.min;
            if (scope.max !== undefined) config.max = scope.max;
            if (scope.color) config.color = scope.color;
            if (scope.horizontal !== undefined) config.horizontal = scope.horizontal;
            if (scope.yAxis !== undefined) config.yAxis = scope.yAxis;
            if (scope.showValue !== undefined) config.showValue = scope.showValue;
            if (scope.format) config.format = scope.format;

            return config;
          }

          /**
           * Create the widget
           */
          function createWidget() {
            if (!isWidgetsAvailable()) {
              console.error('JSCWidgets.BarColumn is not available. Include jscharting-widgets.js.');
              return;
            }

            var config = buildConfig();

            try {
              widget = new JSCWidgets.BarColumn(element[0], config, function() {
                $timeout(function() {
                  scope.widgetInstance = widget;
                  isInitialized = true;
                });
              });
            } catch (e) {
              console.error('Error creating BarColumn widget:', e);
            }
          }

          /**
           * Update the widget
           */
          function updateWidget(options) {
            if (widget && typeof widget.options === 'function') {
              try {
                widget.options(options);
              } catch (e) {
                console.warn('Error updating BarColumn widget:', e);
              }
            }
          }

          // Watch for value changes (deep watch since value can be array)
          scope.$watch('value', function(newVal, oldVal) {
            if (!angular.equals(newVal, oldVal) && isInitialized) {
              updateWidget({ value: newVal });
            }
          }, true);

          // Watch for label changes
          scope.$watch('label', function(newVal, oldVal) {
            if (!angular.equals(newVal, oldVal) && isInitialized) {
              updateWidget({ label: newVal });
            }
          }, true);

          // Watch for color changes
          scope.$watch('color', function(newVal, oldVal) {
            if (newVal !== oldVal && isInitialized) {
              updateWidget({ color: newVal });
            }
          });

          // Watch for min/max changes
          scope.$watchGroup(['min', 'max'], function(newVals, oldVals) {
            if ((newVals[0] !== oldVals[0] || newVals[1] !== oldVals[1]) && isInitialized) {
              var updates = {};
              if (newVals[0] !== undefined) updates.min = newVals[0];
              if (newVals[1] !== undefined) updates.max = newVals[1];
              updateWidget(updates);
            }
          });

          // Cleanup
          scope.$on('$destroy', function() {
            if (widget && typeof widget.destroy === 'function') {
              widget.destroy();
            }
            widget = null;
            scope.widgetInstance = null;
          });

          // Initialize
          createWidget();
        }
      };
    }]);

})(angular);

/**
 * JSCharting AngularJS Maps Module
 *
 * Provides map chart directive with simplified API.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.maps', ['jsc.angular.core']);

})(angular);

/**
 * JSCharting AngularJS Map Directive
 *
 * Simplified directive for map charts with convenient API.
 *
 * Usage:
 *   <jsc-map
 *     jsc-map="US"
 *     jsc-series="vm.stateData"
 *     jsc-palette="vm.colorPalette"
 *     jsc-on-point-click="vm.onStateClick(point)"
 *     jsc-instance="vm.mapChart">
 *   </jsc-map>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.maps')
    .directive('jscMap', [
      '$timeout',
      'jscChartFactory',
      'jscModuleLoader',
      'jscConfig',
      function($timeout, jscChartFactory, jscModuleLoader, jscConfig) {

        return {
          restrict: 'EA',
          scope: {
            // Map configuration
            map: '@jscMap',
            series: '=?jscSeries',
            options: '=?jscOptions',
            palette: '<?jscPalette',
            mapping: '<?jscMapping',

            // Chart configuration
            title: '@?jscTitle',
            legend: '<?jscLegend',
            legendPosition: '@?jscLegendPosition',
            tooltip: '<?jscTooltip',
            debug: '<?jscDebug',

            // Zoom and projection
            projection: '<?jscProjection',
            zoomEnabled: '<?jscZoomEnabled',

            // Output
            chartInstance: '=?jscInstance',

            // Events
            onLoad: '&?jscOnLoad',
            onPointClick: '&?jscOnPointClick',
            onPointMouseOver: '&?jscOnPointMouseOver',
            onPointMouseOut: '&?jscOnPointMouseOut',
            onZoomed: '&?jscOnZoomed',
            onSelecting: '&?jscOnSelecting',
            onSelection: '&?jscOnSelection'
          },

          link: function(scope, element, attrs) {
            var chart = null;
            var isInitialized = false;
            var debounceTimeout = null;

            /**
             * Build chart configuration
             */
            function buildConfig() {
              var config = angular.copy(scope.options) || {};

              // Set type to map
              config.type = 'map';

              // Configure mapping
              config.mapping = config.mapping || {};

              if (scope.map) {
                config.mapping.base = config.mapping.base || {};
                config.mapping.base.layers = scope.map;
              }

              if (scope.mapping) {
                angular.merge(config.mapping, scope.mapping);
              }

              if (scope.projection !== undefined) {
                config.mapping.projection = scope.projection;
              }

              // Apply series
              if (scope.series) {
                config.series = angular.copy(scope.series);
              }

              // Apply palette
              if (scope.palette) {
                config.palette = scope.palette;
              }

              // Apply title
              if (scope.title) {
                config.title = config.title || {};
                config.title.label = config.title.label || {};
                config.title.label.text = scope.title;
              }

              // Apply legend
              if (scope.legend) {
                config.legend = scope.legend;
              } else if (scope.legendPosition) {
                config.legend = config.legend || {};
                config.legend.position = scope.legendPosition;
              }

              // Apply tooltip
              if (scope.tooltip) {
                config.defaultTooltip = scope.tooltip;
              }

              // Apply debug
              if (scope.debug !== undefined) {
                config.debug = scope.debug;
              }

              // Apply zoom
              if (scope.zoomEnabled !== undefined) {
                if (scope.zoomEnabled) {
                  config.axisToZoom = 'xy';
                } else {
                  config.axisToZoom = 'none';
                }
              }

              // Wire events
              wireEvents(config);

              return config;
            }

            /**
             * Wire event callbacks
             */
            function wireEvents(config) {
              config.events = config.events || {};

              if (scope.onZoomed) {
                config.events.zoomed = function(e) {
                  $timeout(function() {
                    scope.onZoomed({ event: e, chart: chart });
                  });
                };
              }

              if (scope.onSelecting) {
                config.events.selecting = function(e) {
                  $timeout(function() {
                    scope.onSelecting({ event: e, chart: chart });
                  });
                };
              }

              if (scope.onSelection) {
                config.events.selection = function(e) {
                  $timeout(function() {
                    scope.onSelection({ event: e, chart: chart });
                  });
                };
              }

              // Point events
              if (scope.onPointClick || scope.onPointMouseOver || scope.onPointMouseOut) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.events = config.defaultPoint.events || {};

                if (scope.onPointClick) {
                  config.defaultPoint.events.click = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointClick({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOver) {
                  config.defaultPoint.events.mouseOver = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOver({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOut) {
                  config.defaultPoint.events.mouseOut = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOut({ event: e, point: point, chart: chart });
                    });
                  };
                }
              }
            }

            /**
             * Initialize the chart
             */
            function initChart() {
              // Load maps module first
              jscModuleLoader.loadMaps().then(function() {
                var config = buildConfig();

                chart = jscChartFactory.createSync(element[0], config, function(chartInstance) {
                  $timeout(function() {
                    scope.chartInstance = chartInstance;
                    isInitialized = true;

                    if (scope.onLoad) {
                      scope.onLoad({ chart: chartInstance });
                    }
                  });
                });

                if (chart) {
                  scope.chartInstance = chart;
                }
              }).catch(function(error) {
                console.error('Failed to load maps module:', error);
              });
            }

            /**
             * Update the chart
             */
            function updateChart(options) {
              if (chart && typeof chart.options === 'function') {
                try {
                  chart.options(options);
                } catch (e) {
                  console.warn('Error updating map chart:', e);
                }
              }
            }

            /**
             * Schedule debounced update
             */
            function scheduleUpdate() {
              if (debounceTimeout) {
                $timeout.cancel(debounceTimeout);
              }

              debounceTimeout = $timeout(function() {
                var config = buildConfig();
                updateChart(config);
              }, jscConfig.getUpdateDebounceTime());
            }

            // Watch for series changes
            scope.$watch('series', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ series: angular.copy(newVal) });
              }
            }, true);

            // Watch for map changes (requires reinit)
            scope.$watch('map', function(newVal, oldVal) {
              if (newVal !== oldVal && isInitialized) {
                // Map change requires rebuilding
                if (chart) {
                  jscChartFactory.destroy(chart);
                  chart = null;
                  scope.chartInstance = null;
                  isInitialized = false;
                }
                initChart();
              }
            });

            // Watch for palette changes
            scope.$watch('palette', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ palette: newVal });
              }
            }, true);

            // Watch for options changes
            scope.$watch('options', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                scheduleUpdate();
              }
            }, true);

            // Cleanup
            scope.$on('$destroy', function() {
              if (debounceTimeout) {
                $timeout.cancel(debounceTimeout);
              }

              if (chart) {
                jscChartFactory.destroy(chart);
                chart = null;
              }

              scope.chartInstance = null;
            });

            // Initialize
            initChart();
          }
        };
      }
    ]);

})(angular);

/**
 * JSCharting AngularJS Grid Module
 *
 * Provides data grid/table directive.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.grid', ['jsc.angular.core']);

})(angular);

/**
 * JSCharting AngularJS Grid Directive
 *
 * Displays a data grid/table with sorting and formatting capabilities.
 *
 * Usage:
 *   <jsc-grid
 *     jsc-data="vm.tableData"
 *     jsc-columns="vm.columnConfig"
 *     jsc-header-row="true"
 *     jsc-class-name="'my-grid'"
 *     jsc-instance="vm.grid">
 *   </jsc-grid>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.grid')
    .directive('jscGrid', [
      '$timeout',
      'jscModuleLoader',
      function($timeout, jscModuleLoader) {

        return {
          restrict: 'EA',
          scope: {
            data: '=jscData',
            columns: '<?jscColumns',
            headerRow: '<?jscHeaderRow',
            headerCol: '<?jscHeaderCol',
            summaryRow: '<?jscSummaryRow',
            className: '@?jscClassName',
            options: '<?jscOptions',
            sortable: '<?jscSortable',
            gridInstance: '=?jscInstance'
          },

          link: function(scope, element, attrs) {
            var grid = null;
            var isInitialized = false;

            /**
             * Check if JSC.Grid is available
             */
            function isGridAvailable() {
              return typeof JSC !== 'undefined' && typeof JSC.Grid === 'function';
            }

            /**
             * Build grid configuration
             */
            function buildConfig() {
              var config = angular.extend({}, scope.options);

              if (scope.data !== undefined) config.data = scope.data;
              if (scope.columns !== undefined) config.columns = scope.columns;
              if (scope.headerRow !== undefined) config.headerRow = scope.headerRow;
              if (scope.headerCol !== undefined) config.headerCol = scope.headerCol;
              if (scope.summaryRow !== undefined) config.summaryRow = scope.summaryRow;
              if (scope.className) config.className = scope.className;
              if (scope.sortable !== undefined) config.sortable = scope.sortable;

              return config;
            }

            /**
             * Create the grid
             */
            function createGrid() {
              // Load datagrid module first
              jscModuleLoader.loadDataGrid().then(function() {
                if (!isGridAvailable()) {
                  console.error('JSC.Grid is not available. Ensure datagrid module is loaded.');
                  return;
                }

                var config = buildConfig();

                try {
                  grid = new JSC.Grid(element[0], config);

                  $timeout(function() {
                    scope.gridInstance = grid;
                    isInitialized = true;
                  });
                } catch (e) {
                  console.error('Error creating Grid:', e);
                }
              }).catch(function(error) {
                console.error('Failed to load datagrid module:', error);
              });
            }

            /**
             * Update the grid
             */
            function updateGrid(options) {
              if (grid && typeof grid.options === 'function') {
                try {
                  grid.options(options);
                } catch (e) {
                  console.warn('Error updating Grid:', e);
                }
              }
            }

            // Watch for data changes
            scope.$watch('data', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateGrid({ data: newVal });
              }
            }, true);

            // Watch for columns changes
            scope.$watch('columns', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateGrid({ columns: newVal });
              }
            }, true);

            // Watch for options changes
            scope.$watch('options', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateGrid(buildConfig());
              }
            }, true);

            // Cleanup
            scope.$on('$destroy', function() {
              if (grid && typeof grid.dispose === 'function') {
                grid.dispose();
              } else if (grid && typeof grid.destroy === 'function') {
                grid.destroy();
              }
              grid = null;
              scope.gridInstance = null;
            });

            // Initialize
            createGrid();
          }
        };
      }
    ]);

})(angular);

/**
 * JSCharting AngularJS Organizational Chart Directive
 *
 * Simplified directive for organizational/hierarchy charts.
 *
 * Usage:
 *   <jsc-org-chart
 *     jsc-series="vm.orgData"
 *     jsc-orientation="'vertical'"
 *     jsc-on-point-click="vm.onNodeClick(point)"
 *     jsc-instance="vm.orgChart">
 *   </jsc-org-chart>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .directive('jscOrgChart', [
      '$timeout',
      'jscChartFactory',
      'jscModuleLoader',
      'jscConfig',
      function($timeout, jscChartFactory, jscModuleLoader, jscConfig) {

        return {
          restrict: 'EA',
          scope: {
            series: '=?jscSeries',
            options: '=?jscOptions',
            orientation: '@?jscOrientation',
            pointWidth: '<?jscPointWidth',
            pointPadding: '<?jscPointPadding',
            connectorLine: '<?jscConnectorLine',
            palette: '<?jscPalette',
            title: '@?jscTitle',
            debug: '<?jscDebug',

            // Output
            chartInstance: '=?jscInstance',

            // Events
            onLoad: '&?jscOnLoad',
            onPointClick: '&?jscOnPointClick',
            onPointMouseOver: '&?jscOnPointMouseOver',
            onPointMouseOut: '&?jscOnPointMouseOut'
          },

          link: function(scope, element, attrs) {
            var chart = null;
            var isInitialized = false;
            var debounceTimeout = null;

            /**
             * Build chart configuration
             */
            function buildConfig() {
              var config = angular.copy(scope.options) || {};

              // Set type to organizational
              config.type = 'organizational' + (scope.orientation === 'horizontal' ? ' horizontal' : '');

              // Apply series
              if (scope.series) {
                config.series = angular.copy(scope.series);
              }

              // Apply palette
              if (scope.palette) {
                config.palette = scope.palette;
              }

              // Apply title
              if (scope.title) {
                config.title = config.title || {};
                config.title.label = config.title.label || {};
                config.title.label.text = scope.title;
              }

              // Apply debug
              if (scope.debug !== undefined) {
                config.debug = scope.debug;
              }

              // Configure default series for org chart
              config.defaultSeries = config.defaultSeries || {};

              if (scope.pointWidth !== undefined) {
                config.defaultSeries.pointWidth = scope.pointWidth;
              }

              if (scope.pointPadding !== undefined) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.padding = scope.pointPadding;
              }

              // Configure connector lines
              if (scope.connectorLine) {
                config.defaultSeries.line = scope.connectorLine;
              }

              // Wire events
              wireEvents(config);

              return config;
            }

            /**
             * Wire event callbacks
             */
            function wireEvents(config) {
              if (scope.onPointClick || scope.onPointMouseOver || scope.onPointMouseOut) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.events = config.defaultPoint.events || {};

                if (scope.onPointClick) {
                  config.defaultPoint.events.click = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointClick({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOver) {
                  config.defaultPoint.events.mouseOver = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOver({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOut) {
                  config.defaultPoint.events.mouseOut = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOut({ event: e, point: point, chart: chart });
                    });
                  };
                }
              }
            }

            /**
             * Initialize the chart
             */
            function initChart() {
              // Load types module first
              jscModuleLoader.loadTypes().then(function() {
                var config = buildConfig();

                chart = jscChartFactory.createSync(element[0], config, function(chartInstance) {
                  $timeout(function() {
                    scope.chartInstance = chartInstance;
                    isInitialized = true;

                    if (scope.onLoad) {
                      scope.onLoad({ chart: chartInstance });
                    }
                  });
                });

                if (chart) {
                  scope.chartInstance = chart;
                }
              }).catch(function(error) {
                console.error('Failed to load types module:', error);
              });
            }

            /**
             * Update the chart
             */
            function updateChart(options) {
              if (chart && typeof chart.options === 'function') {
                try {
                  chart.options(options);
                } catch (e) {
                  console.warn('Error updating org chart:', e);
                }
              }
            }

            // Watch for series changes
            scope.$watch('series', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ series: angular.copy(newVal) });
              }
            }, true);

            // Watch for options changes
            scope.$watch('options', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                if (debounceTimeout) $timeout.cancel(debounceTimeout);
                debounceTimeout = $timeout(function() {
                  updateChart(buildConfig());
                }, jscConfig.getUpdateDebounceTime());
              }
            }, true);

            // Cleanup
            scope.$on('$destroy', function() {
              if (debounceTimeout) $timeout.cancel(debounceTimeout);
              if (chart) {
                jscChartFactory.destroy(chart);
                chart = null;
              }
              scope.chartInstance = null;
            });

            // Initialize
            initChart();
          }
        };
      }
    ]);

})(angular);

/**
 * JSCharting AngularJS Calendar Chart Directive
 *
 * Simplified directive for calendar/heatmap charts.
 *
 * Usage:
 *   <jsc-calendar
 *     jsc-data="vm.calendarData"
 *     jsc-year="2024"
 *     jsc-palette="vm.heatmapColors"
 *     jsc-on-point-click="vm.onDateClick(point)"
 *     jsc-instance="vm.calendar">
 *   </jsc-calendar>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .directive('jscCalendar', [
      '$timeout',
      'jscChartFactory',
      'jscModuleLoader',
      'jscConfig',
      function($timeout, jscChartFactory, jscModuleLoader, jscConfig) {

        return {
          restrict: 'EA',
          scope: {
            data: '=?jscData',
            series: '=?jscSeries',
            options: '=?jscOptions',
            year: '<?jscYear',
            month: '<?jscMonth',
            orientation: '@?jscOrientation',
            palette: '<?jscPalette',
            title: '@?jscTitle',
            debug: '<?jscDebug',
            calendarConfig: '<?jscCalendarConfig',

            // Output
            chartInstance: '=?jscInstance',

            // Events
            onLoad: '&?jscOnLoad',
            onPointClick: '&?jscOnPointClick',
            onPointMouseOver: '&?jscOnPointMouseOver',
            onPointMouseOut: '&?jscOnPointMouseOut'
          },

          link: function(scope, element, attrs) {
            var chart = null;
            var isInitialized = false;
            var debounceTimeout = null;

            /**
             * Build chart configuration
             */
            function buildConfig() {
              var config = angular.copy(scope.options) || {};

              // Set type to calendar
              config.type = 'calendar' + (scope.orientation === 'horizontal' ? ' horizontal' : '');

              // Apply data
              if (scope.data) {
                config.data = scope.data;
              }

              // Apply series
              if (scope.series) {
                config.series = angular.copy(scope.series);
              }

              // Configure calendar
              config.calendar = config.calendar || {};

              if (scope.year !== undefined) {
                config.calendar.year = scope.year;
              }

              if (scope.month !== undefined) {
                config.calendar.month = scope.month;
              }

              if (scope.calendarConfig) {
                angular.merge(config.calendar, scope.calendarConfig);
              }

              // Apply palette
              if (scope.palette) {
                config.palette = scope.palette;
              }

              // Apply title
              if (scope.title) {
                config.title = config.title || {};
                config.title.label = config.title.label || {};
                config.title.label.text = scope.title;
              }

              // Apply debug
              if (scope.debug !== undefined) {
                config.debug = scope.debug;
              }

              // Wire events
              wireEvents(config);

              return config;
            }

            /**
             * Wire event callbacks
             */
            function wireEvents(config) {
              if (scope.onPointClick || scope.onPointMouseOver || scope.onPointMouseOut) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.events = config.defaultPoint.events || {};

                if (scope.onPointClick) {
                  config.defaultPoint.events.click = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointClick({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOver) {
                  config.defaultPoint.events.mouseOver = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOver({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOut) {
                  config.defaultPoint.events.mouseOut = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOut({ event: e, point: point, chart: chart });
                    });
                  };
                }
              }
            }

            /**
             * Initialize the chart
             */
            function initChart() {
              // Load types module first
              jscModuleLoader.loadTypes().then(function() {
                var config = buildConfig();

                chart = jscChartFactory.createSync(element[0], config, function(chartInstance) {
                  $timeout(function() {
                    scope.chartInstance = chartInstance;
                    isInitialized = true;

                    if (scope.onLoad) {
                      scope.onLoad({ chart: chartInstance });
                    }
                  });
                });

                if (chart) {
                  scope.chartInstance = chart;
                }
              }).catch(function(error) {
                console.error('Failed to load types module:', error);
              });
            }

            /**
             * Update the chart
             */
            function updateChart(options) {
              if (chart && typeof chart.options === 'function') {
                try {
                  chart.options(options);
                } catch (e) {
                  console.warn('Error updating calendar chart:', e);
                }
              }
            }

            // Watch for data changes
            scope.$watch('data', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ data: newVal });
              }
            }, true);

            // Watch for series changes
            scope.$watch('series', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ series: angular.copy(newVal) });
              }
            }, true);

            // Watch for year/month changes
            scope.$watchGroup(['year', 'month'], function(newVals, oldVals) {
              if ((newVals[0] !== oldVals[0] || newVals[1] !== oldVals[1]) && isInitialized) {
                var updates = { calendar: {} };
                if (newVals[0] !== undefined) updates.calendar.year = newVals[0];
                if (newVals[1] !== undefined) updates.calendar.month = newVals[1];
                updateChart(updates);
              }
            });

            // Watch for options changes
            scope.$watch('options', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                if (debounceTimeout) $timeout.cancel(debounceTimeout);
                debounceTimeout = $timeout(function() {
                  updateChart(buildConfig());
                }, jscConfig.getUpdateDebounceTime());
              }
            }, true);

            // Cleanup
            scope.$on('$destroy', function() {
              if (debounceTimeout) $timeout.cancel(debounceTimeout);
              if (chart) {
                jscChartFactory.destroy(chart);
                chart = null;
              }
              scope.chartInstance = null;
            });

            // Initialize
            initChart();
          }
        };
      }
    ]);

})(angular);

/**
 * JSCharting AngularJS Gantt Chart Directive
 *
 * Simplified directive for Gantt/timeline charts.
 *
 * Usage:
 *   <jsc-gantt
 *     jsc-series="vm.taskData"
 *     jsc-show-dependencies="true"
 *     jsc-on-point-click="vm.onTaskClick(point)"
 *     jsc-instance="vm.ganttChart">
 *   </jsc-gantt>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .directive('jscGantt', [
      '$timeout',
      'jscChartFactory',
      'jscModuleLoader',
      'jscConfig',
      function($timeout, jscChartFactory, jscModuleLoader, jscConfig) {

        return {
          restrict: 'EA',
          scope: {
            series: '=?jscSeries',
            options: '=?jscOptions',
            showDependencies: '<?jscShowDependencies',
            criticalPath: '<?jscCriticalPath',
            palette: '<?jscPalette',
            title: '@?jscTitle',
            debug: '<?jscDebug',
            dateFormat: '@?jscDateFormat',
            xAxisConfig: '<?jscXAxisConfig',
            yAxisConfig: '<?jscYAxisConfig',

            // Output
            chartInstance: '=?jscInstance',

            // Events
            onLoad: '&?jscOnLoad',
            onPointClick: '&?jscOnPointClick',
            onPointMouseOver: '&?jscOnPointMouseOver',
            onPointMouseOut: '&?jscOnPointMouseOut',
            onZoomed: '&?jscOnZoomed'
          },

          link: function(scope, element, attrs) {
            var chart = null;
            var isInitialized = false;
            var debounceTimeout = null;

            /**
             * Build chart configuration
             */
            function buildConfig() {
              var config = angular.copy(scope.options) || {};

              // Set type to gantt
              config.type = 'gantt';

              // Apply series
              if (scope.series) {
                config.series = angular.copy(scope.series);
              }

              // Apply palette
              if (scope.palette) {
                config.palette = scope.palette;
              }

              // Apply title
              if (scope.title) {
                config.title = config.title || {};
                config.title.label = config.title.label || {};
                config.title.label.text = scope.title;
              }

              // Apply debug
              if (scope.debug !== undefined) {
                config.debug = scope.debug;
              }

              // Configure X axis (time axis)
              config.xAxis = config.xAxis || {};
              if (scope.xAxisConfig) {
                angular.merge(config.xAxis, scope.xAxisConfig);
              }

              // Configure Y axis (tasks)
              config.yAxis = config.yAxis || {};
              if (scope.yAxisConfig) {
                angular.merge(config.yAxis, scope.yAxisConfig);
              }

              // Configure dependencies
              if (scope.showDependencies !== undefined) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.connectorLine = config.defaultPoint.connectorLine || {};
                config.defaultPoint.connectorLine.visible = scope.showDependencies;
              }

              // Configure critical path highlighting
              if (scope.criticalPath !== undefined) {
                config.defaultSeries = config.defaultSeries || {};
                config.defaultSeries.criticalPath = scope.criticalPath;
              }

              // Wire events
              wireEvents(config);

              return config;
            }

            /**
             * Wire event callbacks
             */
            function wireEvents(config) {
              config.events = config.events || {};

              if (scope.onZoomed) {
                config.events.zoomed = function(e) {
                  $timeout(function() {
                    scope.onZoomed({ event: e, chart: chart });
                  });
                };
              }

              if (scope.onPointClick || scope.onPointMouseOver || scope.onPointMouseOut) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.events = config.defaultPoint.events || {};

                if (scope.onPointClick) {
                  config.defaultPoint.events.click = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointClick({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOver) {
                  config.defaultPoint.events.mouseOver = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOver({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOut) {
                  config.defaultPoint.events.mouseOut = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOut({ event: e, point: point, chart: chart });
                    });
                  };
                }
              }
            }

            /**
             * Initialize the chart
             */
            function initChart() {
              // Load types module first
              jscModuleLoader.loadTypes().then(function() {
                var config = buildConfig();

                chart = jscChartFactory.createSync(element[0], config, function(chartInstance) {
                  $timeout(function() {
                    scope.chartInstance = chartInstance;
                    isInitialized = true;

                    if (scope.onLoad) {
                      scope.onLoad({ chart: chartInstance });
                    }
                  });
                });

                if (chart) {
                  scope.chartInstance = chart;
                }
              }).catch(function(error) {
                console.error('Failed to load types module:', error);
              });
            }

            /**
             * Update the chart
             */
            function updateChart(options) {
              if (chart && typeof chart.options === 'function') {
                try {
                  chart.options(options);
                } catch (e) {
                  console.warn('Error updating gantt chart:', e);
                }
              }
            }

            // Watch for series changes
            scope.$watch('series', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ series: angular.copy(newVal) });
              }
            }, true);

            // Watch for options changes
            scope.$watch('options', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                if (debounceTimeout) $timeout.cancel(debounceTimeout);
                debounceTimeout = $timeout(function() {
                  updateChart(buildConfig());
                }, jscConfig.getUpdateDebounceTime());
              }
            }, true);

            // Cleanup
            scope.$on('$destroy', function() {
              if (debounceTimeout) $timeout.cancel(debounceTimeout);
              if (chart) {
                jscChartFactory.destroy(chart);
                chart = null;
              }
              scope.chartInstance = null;
            });

            // Initialize
            initChart();
          }
        };
      }
    ]);

})(angular);

/**
 * JSCharting AngularJS Radar Chart Directive
 *
 * Simplified directive for radar/spider charts.
 *
 * Usage:
 *   <jsc-radar
 *     jsc-series="vm.radarData"
 *     jsc-categories="vm.categories"
 *     jsc-filled="true"
 *     jsc-instance="vm.radarChart">
 *   </jsc-radar>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .directive('jscRadar', [
      '$timeout',
      'jscChartFactory',
      'jscModuleLoader',
      'jscConfig',
      function($timeout, jscChartFactory, jscModuleLoader, jscConfig) {

        return {
          restrict: 'EA',
          scope: {
            series: '=?jscSeries',
            options: '=?jscOptions',
            categories: '<?jscCategories',
            filled: '<?jscFilled',
            startAngle: '<?jscStartAngle',
            palette: '<?jscPalette',
            title: '@?jscTitle',
            legendPosition: '@?jscLegendPosition',
            debug: '<?jscDebug',

            // Output
            chartInstance: '=?jscInstance',

            // Events
            onLoad: '&?jscOnLoad',
            onPointClick: '&?jscOnPointClick',
            onPointMouseOver: '&?jscOnPointMouseOver',
            onPointMouseOut: '&?jscOnPointMouseOut',
            onSeriesClick: '&?jscOnSeriesClick'
          },

          link: function(scope, element, attrs) {
            var chart = null;
            var isInitialized = false;
            var debounceTimeout = null;

            /**
             * Build chart configuration
             */
            function buildConfig() {
              var config = angular.copy(scope.options) || {};

              // Set type to radar
              var typeStr = 'radar';
              if (scope.filled) {
                typeStr += ' area';
              }
              config.type = typeStr;

              // Apply series
              if (scope.series) {
                config.series = angular.copy(scope.series);
              }

              // Apply categories to x-axis
              if (scope.categories) {
                config.xAxis = config.xAxis || {};
                config.xAxis.categories = scope.categories;
              }

              // Apply start angle
              if (scope.startAngle !== undefined) {
                config.xAxis = config.xAxis || {};
                config.xAxis.scale = config.xAxis.scale || {};
                config.xAxis.scale.startAngle = scope.startAngle;
              }

              // Apply palette
              if (scope.palette) {
                config.palette = scope.palette;
              }

              // Apply title
              if (scope.title) {
                config.title = config.title || {};
                config.title.label = config.title.label || {};
                config.title.label.text = scope.title;
              }

              // Apply legend position
              if (scope.legendPosition) {
                config.legend = config.legend || {};
                config.legend.position = scope.legendPosition;
              }

              // Apply debug
              if (scope.debug !== undefined) {
                config.debug = scope.debug;
              }

              // Wire events
              wireEvents(config);

              return config;
            }

            /**
             * Wire event callbacks
             */
            function wireEvents(config) {
              // Point events
              if (scope.onPointClick || scope.onPointMouseOver || scope.onPointMouseOut) {
                config.defaultPoint = config.defaultPoint || {};
                config.defaultPoint.events = config.defaultPoint.events || {};

                if (scope.onPointClick) {
                  config.defaultPoint.events.click = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointClick({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOver) {
                  config.defaultPoint.events.mouseOver = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOver({ event: e, point: point, chart: chart });
                    });
                  };
                }

                if (scope.onPointMouseOut) {
                  config.defaultPoint.events.mouseOut = function(e) {
                    var point = this;
                    $timeout(function() {
                      scope.onPointMouseOut({ event: e, point: point, chart: chart });
                    });
                  };
                }
              }

              // Series events
              if (scope.onSeriesClick) {
                config.defaultSeries = config.defaultSeries || {};
                config.defaultSeries.events = config.defaultSeries.events || {};
                config.defaultSeries.events.click = function(e) {
                  var series = this;
                  $timeout(function() {
                    scope.onSeriesClick({ event: e, series: series, chart: chart });
                  });
                };
              }
            }

            /**
             * Initialize the chart
             */
            function initChart() {
              // Load types module first
              jscModuleLoader.loadTypes().then(function() {
                var config = buildConfig();

                chart = jscChartFactory.createSync(element[0], config, function(chartInstance) {
                  $timeout(function() {
                    scope.chartInstance = chartInstance;
                    isInitialized = true;

                    if (scope.onLoad) {
                      scope.onLoad({ chart: chartInstance });
                    }
                  });
                });

                if (chart) {
                  scope.chartInstance = chart;
                }
              }).catch(function(error) {
                console.error('Failed to load types module:', error);
              });
            }

            /**
             * Update the chart
             */
            function updateChart(options) {
              if (chart && typeof chart.options === 'function') {
                try {
                  chart.options(options);
                } catch (e) {
                  console.warn('Error updating radar chart:', e);
                }
              }
            }

            // Watch for series changes
            scope.$watch('series', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ series: angular.copy(newVal) });
              }
            }, true);

            // Watch for categories changes
            scope.$watch('categories', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateChart({ xAxis: { categories: newVal } });
              }
            }, true);

            // Watch for options changes
            scope.$watch('options', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                if (debounceTimeout) $timeout.cancel(debounceTimeout);
                debounceTimeout = $timeout(function() {
                  updateChart(buildConfig());
                }, jscConfig.getUpdateDebounceTime());
              }
            }, true);

            // Cleanup
            scope.$on('$destroy', function() {
              if (debounceTimeout) $timeout.cancel(debounceTimeout);
              if (chart) {
                jscChartFactory.destroy(chart);
                chart = null;
              }
              scope.chartInstance = null;
            });

            // Initialize
            initChart();
          }
        };
      }
    ]);

})(angular);

/**
 * JSCharting AngularJS Main Module
 *
 * This is the main entry point for the JSCharting AngularJS wrapper.
 * Include this module in your application to get access to all
 * JSCharting components, directives, and services.
 *
 * Usage:
 *   angular.module('myApp', ['jsc.angular'])
 *
 * Available Directives:
 *   - jsc-chart: Main chart directive (supports all 150+ chart types)
 *   - jsc-map: Map chart directive
 *   - jsc-grid: Data grid directive
 *   - jsc-org-chart: Organizational chart directive
 *   - jsc-calendar: Calendar chart directive
 *   - jsc-gantt: Gantt chart directive
 *   - jsc-radar: Radar chart directive
 *   - jsc-linear-widget: Linear gauge widget
 *   - jsc-circular-widget: Circular gauge widget
 *   - jsc-bar-column-widget: Bar/column micro widget
 *
 * Available Services:
 *   - jscChartFactory: Create and manage chart instances
 *   - jscDataService: Data loading and transformation
 *   - jscConfigBuilder: Fluent configuration builder
 *   - jscEventService: Cross-chart event communication
 *   - jscModuleLoader: Lazy module loading
 *   - jscPerformance: Performance utilities
 *
 * Available Providers (configure in app.config):
 *   - jscConfigProvider: Set global defaults
 *   - jscModuleLoaderProvider: Configure module base URL
 *   - jscChartFactoryProvider: Configure factory behavior
 */
(function(angular) {
  'use strict';

  // Create the main module that aggregates all sub-modules
  angular.module('jsc.angular', [
    'jsc.angular.core',
    'jsc.angular.widgets',
    'jsc.angular.maps',
    'jsc.angular.grid'
  ])

  /**
   * Run block to validate JSCharting is available
   */
  .run(['$log', 'jscChartFactory', function($log, jscChartFactory) {
    if (!jscChartFactory.isAvailable()) {
      $log.warn('JSCharting library not detected. Please include jscharting.js before jscharting-angularjs.js');
    } else {
      var version = jscChartFactory.getVersion();
      if (version) {
        $log.debug('JSCharting AngularJS wrapper initialized. JSCharting version: ' + version);
      }
    }
  }])

  /**
   * Constant containing version information
   */
  .constant('JSC_ANGULAR_VERSION', '1.0.0')

  /**
   * Constant containing supported chart types
   */
  .constant('JSC_CHART_TYPES', {
    // Basic types
    basic: ['line', 'spline', 'stepLine', 'area', 'areaSpline', 'column', 'bar', 'scatter', 'bubble'],

    // Pie types
    pie: ['pie', 'donut', 'pyramid', 'funnel', 'cone'],

    // Financial
    financial: ['candlestick', 'ohlc', 'hilo', 'stock'],

    // Specialty
    specialty: ['radar', 'polar', 'gauge', 'heatmap', 'treemap', 'organizational', 'calendar', 'gantt'],

    // Map
    map: ['map'],

    // Modifiers
    modifiers: ['horizontal', 'stacked', 'fullStacked', 'solid', 'range']
  })

  /**
   * Filter for formatting chart values
   */
  .filter('jscFormat', ['jscDataService', function(jscDataService) {
    return function(value, format, culture) {
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'number') {
        return jscDataService.formatNumber(value, format, culture);
      }

      if (value instanceof Date) {
        return jscDataService.formatDate(value, format, culture);
      }

      return String(value);
    };
  }]);

})(angular);

//# sourceMappingURL=jscharting-angularjs.js.map
