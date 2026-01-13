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
