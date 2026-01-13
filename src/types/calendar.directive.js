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
