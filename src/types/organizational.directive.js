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
