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
