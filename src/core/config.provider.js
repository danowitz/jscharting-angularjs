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
