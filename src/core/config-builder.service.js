/**
 * JSCharting AngularJS Config Builder Service
 *
 * Provides a fluent API for building chart configurations.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .factory('jscConfigBuilder', [function() {

      /**
       * ConfigBuilder class
       * @constructor
       */
      function ConfigBuilder() {
        this.config = {};
      }

      ConfigBuilder.prototype = {
        /**
         * Set chart type
         * @param {string} type - Chart type
         * @returns {ConfigBuilder}
         */
        type: function(type) {
          this.config.type = type;
          return this;
        },

        /**
         * Set chart title
         * @param {string} text - Title text
         * @param {Object} [options] - Additional title options
         * @returns {ConfigBuilder}
         */
        title: function(text, options) {
          this.config.title = angular.extend({
            label: { text: text }
          }, options);
          return this;
        },

        /**
         * Configure X axis
         * @param {Object} options - Axis options
         * @returns {ConfigBuilder}
         */
        xAxis: function(options) {
          this.config.xAxis = options;
          return this;
        },

        /**
         * Set X axis label
         * @param {string} text - Label text
         * @returns {ConfigBuilder}
         */
        xAxisLabel: function(text) {
          this.config.xAxis = this.config.xAxis || {};
          this.config.xAxis.label = { text: text };
          return this;
        },

        /**
         * Set X axis categories
         * @param {Array} categories - Category labels
         * @returns {ConfigBuilder}
         */
        xAxisCategories: function(categories) {
          this.config.xAxis = this.config.xAxis || {};
          this.config.xAxis.categories = categories;
          return this;
        },

        /**
         * Configure Y axis
         * @param {Object} options - Axis options
         * @returns {ConfigBuilder}
         */
        yAxis: function(options) {
          this.config.yAxis = options;
          return this;
        },

        /**
         * Set Y axis label
         * @param {string} text - Label text
         * @returns {ConfigBuilder}
         */
        yAxisLabel: function(text) {
          this.config.yAxis = this.config.yAxis || {};
          this.config.yAxis.label = { text: text };
          return this;
        },

        /**
         * Set Y axis scale range
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {ConfigBuilder}
         */
        yAxisRange: function(min, max) {
          this.config.yAxis = this.config.yAxis || {};
          this.config.yAxis.scale = this.config.yAxis.scale || {};
          if (min !== undefined) this.config.yAxis.scale.min = min;
          if (max !== undefined) this.config.yAxis.scale.max = max;
          return this;
        },

        /**
         * Set series data
         * @param {Array} seriesArray - Array of series objects
         * @returns {ConfigBuilder}
         */
        series: function(seriesArray) {
          this.config.series = seriesArray;
          return this;
        },

        /**
         * Add a single series
         * @param {string} name - Series name
         * @param {Array} points - Data points
         * @param {Object} [options] - Additional series options
         * @returns {ConfigBuilder}
         */
        addSeries: function(name, points, options) {
          this.config.series = this.config.series || [];
          this.config.series.push(angular.extend({
            name: name,
            points: points
          }, options));
          return this;
        },

        /**
         * Set default series options
         * @param {Object} options - Default series configuration
         * @returns {ConfigBuilder}
         */
        defaultSeries: function(options) {
          this.config.defaultSeries = options;
          return this;
        },

        /**
         * Set default point options
         * @param {Object} options - Default point configuration
         * @returns {ConfigBuilder}
         */
        defaultPoint: function(options) {
          this.config.defaultPoint = options;
          return this;
        },

        /**
         * Configure legend
         * @param {Object|string} options - Legend options or position string
         * @returns {ConfigBuilder}
         */
        legend: function(options) {
          if (typeof options === 'string') {
            this.config.legend = { position: options };
          } else {
            this.config.legend = options;
          }
          return this;
        },

        /**
         * Hide legend
         * @returns {ConfigBuilder}
         */
        hideLegend: function() {
          this.config.legend = { visible: false };
          return this;
        },

        /**
         * Set palette
         * @param {string|Array} palette - Palette name or array of colors
         * @returns {ConfigBuilder}
         */
        palette: function(palette) {
          this.config.palette = palette;
          return this;
        },

        /**
         * Set smart palette for data-driven coloring
         * @param {Object} options - Smart palette options
         * @returns {ConfigBuilder}
         */
        smartPalette: function(options) {
          this.config.palette = options;
          return this;
        },

        /**
         * Configure tooltip
         * @param {Object|string} options - Tooltip options or template string
         * @returns {ConfigBuilder}
         */
        tooltip: function(options) {
          if (typeof options === 'string') {
            this.config.defaultTooltip = { label: { text: options } };
          } else {
            this.config.defaultTooltip = options;
          }
          return this;
        },

        /**
         * Configure toolbar
         * @param {Object} options - Toolbar options
         * @returns {ConfigBuilder}
         */
        toolbar: function(options) {
          this.config.toolbar = options;
          return this;
        },

        /**
         * Enable or disable export
         * @param {boolean} enabled - Enable export
         * @returns {ConfigBuilder}
         */
        export: function(enabled) {
          this.config.export = enabled;
          return this;
        },

        /**
         * Configure animation
         * @param {Object|number} options - Animation options or duration
         * @returns {ConfigBuilder}
         */
        animation: function(options) {
          if (typeof options === 'number') {
            this.config.animation = { duration: options };
          } else {
            this.config.animation = options;
          }
          return this;
        },

        /**
         * Disable animation
         * @returns {ConfigBuilder}
         */
        noAnimation: function() {
          this.config.animation = { duration: 0 };
          return this;
        },

        /**
         * Set debug mode
         * @param {boolean} enabled
         * @returns {ConfigBuilder}
         */
        debug: function(enabled) {
          this.config.debug = enabled !== false;
          return this;
        },

        /**
         * Set chart dimensions
         * @param {number|string} width - Width in pixels or percentage
         * @param {number|string} height - Height in pixels or percentage
         * @returns {ConfigBuilder}
         */
        size: function(width, height) {
          if (width) this.config.width = width;
          if (height) this.config.height = height;
          return this;
        },

        /**
         * Set chart margin
         * @param {number|Object} margin - Margin value or object
         * @returns {ConfigBuilder}
         */
        margin: function(margin) {
          if (typeof margin === 'number') {
            this.config.margin = margin;
          } else {
            this.config.margin = margin;
          }
          return this;
        },

        /**
         * Configure zoom behavior
         * @param {string} axis - Axis to zoom ('x', 'y', 'xy', 'none')
         * @returns {ConfigBuilder}
         */
        zoom: function(axis) {
          this.config.axisToZoom = axis;
          return this;
        },

        /**
         * Add annotations
         * @param {Array} annotations - Array of annotation objects
         * @returns {ConfigBuilder}
         */
        annotations: function(annotations) {
          this.config.annotations = annotations;
          return this;
        },

        /**
         * Add a single annotation
         * @param {Object} annotation - Annotation object
         * @returns {ConfigBuilder}
         */
        addAnnotation: function(annotation) {
          this.config.annotations = this.config.annotations || [];
          this.config.annotations.push(annotation);
          return this;
        },

        /**
         * Configure mapping options (for map charts)
         * @param {Object} options - Mapping options
         * @returns {ConfigBuilder}
         */
        mapping: function(options) {
          this.config.mapping = options;
          return this;
        },

        /**
         * Configure calendar options (for calendar charts)
         * @param {Object} options - Calendar options
         * @returns {ConfigBuilder}
         */
        calendar: function(options) {
          this.config.calendar = options;
          return this;
        },

        /**
         * Configure grid options (for data grid)
         * @param {Object} options - Grid options
         * @returns {ConfigBuilder}
         */
        grid: function(options) {
          this.config.grid = options;
          return this;
        },

        /**
         * Set chart events
         * @param {Object} events - Event handlers
         * @returns {ConfigBuilder}
         */
        events: function(events) {
          this.config.events = events;
          return this;
        },

        /**
         * Add a single event handler
         * @param {string} eventName - Event name
         * @param {Function} handler - Event handler
         * @returns {ConfigBuilder}
         */
        on: function(eventName, handler) {
          this.config.events = this.config.events || {};
          this.config.events[eventName] = handler;
          return this;
        },

        /**
         * Set point click handler
         * @param {Function} handler - Click handler
         * @returns {ConfigBuilder}
         */
        onPointClick: function(handler) {
          this.config.defaultPoint = this.config.defaultPoint || {};
          this.config.defaultPoint.events = this.config.defaultPoint.events || {};
          this.config.defaultPoint.events.click = handler;
          return this;
        },

        /**
         * Merge additional options
         * @param {Object} options - Options to merge
         * @returns {ConfigBuilder}
         */
        extend: function(options) {
          angular.merge(this.config, options);
          return this;
        },

        /**
         * Apply a template configuration
         * @param {Object} template - Template configuration
         * @returns {ConfigBuilder}
         */
        template: function(template) {
          this.config.template = template;
          return this;
        },

        /**
         * Build and return the configuration
         * @returns {Object} Chart configuration
         */
        build: function() {
          return angular.copy(this.config);
        },

        /**
         * Reset the builder
         * @returns {ConfigBuilder}
         */
        reset: function() {
          this.config = {};
          return this;
        }
      };

      return {
        /**
         * Create a new configuration builder
         * @returns {ConfigBuilder}
         */
        create: function() {
          return new ConfigBuilder();
        },

        /**
         * Create a builder initialized with existing config
         * @param {Object} config - Initial configuration
         * @returns {ConfigBuilder}
         */
        from: function(config) {
          var builder = new ConfigBuilder();
          builder.config = angular.copy(config) || {};
          return builder;
        }
      };
    }]);

})(angular);
