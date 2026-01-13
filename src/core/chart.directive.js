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
