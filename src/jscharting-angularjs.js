/**
 * JSCharting AngularJS Main Module
 *
 * This is the main entry point for the JSCharting AngularJS wrapper.
 * Include this module in your application to get access to all
 * JSCharting components, directives, and services.
 *
 * Usage:
 *   angular.module('myApp', ['jsc.angular'])
 *
 * Available Directives:
 *   - jsc-chart: Main chart directive (supports all 150+ chart types)
 *   - jsc-map: Map chart directive
 *   - jsc-grid: Data grid directive
 *   - jsc-org-chart: Organizational chart directive
 *   - jsc-calendar: Calendar chart directive
 *   - jsc-gantt: Gantt chart directive
 *   - jsc-radar: Radar chart directive
 *   - jsc-linear-widget: Linear gauge widget
 *   - jsc-circular-widget: Circular gauge widget
 *   - jsc-bar-column-widget: Bar/column micro widget
 *
 * Available Services:
 *   - jscChartFactory: Create and manage chart instances
 *   - jscDataService: Data loading and transformation
 *   - jscConfigBuilder: Fluent configuration builder
 *   - jscEventService: Cross-chart event communication
 *   - jscModuleLoader: Lazy module loading
 *   - jscPerformance: Performance utilities
 *
 * Available Providers (configure in app.config):
 *   - jscConfigProvider: Set global defaults
 *   - jscModuleLoaderProvider: Configure module base URL
 *   - jscChartFactoryProvider: Configure factory behavior
 */
(function(angular) {
  'use strict';

  // Create the main module that aggregates all sub-modules
  angular.module('jsc.angular', [
    'jsc.angular.core',
    'jsc.angular.widgets',
    'jsc.angular.maps',
    'jsc.angular.grid'
  ])

  /**
   * Run block to validate JSCharting is available
   */
  .run(['$log', 'jscChartFactory', function($log, jscChartFactory) {
    if (!jscChartFactory.isAvailable()) {
      $log.warn('JSCharting library not detected. Please include jscharting.js before jscharting-angularjs.js');
    } else {
      var version = jscChartFactory.getVersion();
      if (version) {
        $log.debug('JSCharting AngularJS wrapper initialized. JSCharting version: ' + version);
      }
    }
  }])

  /**
   * Constant containing version information
   */
  .constant('JSC_ANGULAR_VERSION', '1.0.0')

  /**
   * Constant containing supported chart types
   */
  .constant('JSC_CHART_TYPES', {
    // Basic types
    basic: ['line', 'spline', 'stepLine', 'area', 'areaSpline', 'column', 'bar', 'scatter', 'bubble'],

    // Pie types
    pie: ['pie', 'donut', 'pyramid', 'funnel', 'cone'],

    // Financial
    financial: ['candlestick', 'ohlc', 'hilo', 'stock'],

    // Specialty
    specialty: ['radar', 'polar', 'gauge', 'heatmap', 'treemap', 'organizational', 'calendar', 'gantt'],

    // Map
    map: ['map'],

    // Modifiers
    modifiers: ['horizontal', 'stacked', 'fullStacked', 'solid', 'range']
  })

  /**
   * Filter for formatting chart values
   */
  .filter('jscFormat', ['jscDataService', function(jscDataService) {
    return function(value, format, culture) {
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'number') {
        return jscDataService.formatNumber(value, format, culture);
      }

      if (value instanceof Date) {
        return jscDataService.formatDate(value, format, culture);
      }

      return String(value);
    };
  }]);

})(angular);
