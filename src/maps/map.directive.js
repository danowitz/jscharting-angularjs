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
