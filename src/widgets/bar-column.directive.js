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
