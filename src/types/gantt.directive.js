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
