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
