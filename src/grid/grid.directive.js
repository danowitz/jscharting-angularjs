/**
 * JSCharting AngularJS Grid Directive
 *
 * Displays a data grid/table with sorting and formatting capabilities.
 *
 * Usage:
 *   <jsc-grid
 *     jsc-data="vm.tableData"
 *     jsc-columns="vm.columnConfig"
 *     jsc-header-row="true"
 *     jsc-class-name="'my-grid'"
 *     jsc-instance="vm.grid">
 *   </jsc-grid>
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.grid')
    .directive('jscGrid', [
      '$timeout',
      'jscModuleLoader',
      function($timeout, jscModuleLoader) {

        return {
          restrict: 'EA',
          scope: {
            data: '=jscData',
            columns: '<?jscColumns',
            headerRow: '<?jscHeaderRow',
            headerCol: '<?jscHeaderCol',
            summaryRow: '<?jscSummaryRow',
            className: '@?jscClassName',
            options: '<?jscOptions',
            sortable: '<?jscSortable',
            gridInstance: '=?jscInstance'
          },

          link: function(scope, element, attrs) {
            var grid = null;
            var isInitialized = false;

            /**
             * Check if JSC.Grid is available
             */
            function isGridAvailable() {
              return typeof JSC !== 'undefined' && typeof JSC.Grid === 'function';
            }

            /**
             * Build grid configuration
             */
            function buildConfig() {
              var config = angular.extend({}, scope.options);

              if (scope.data !== undefined) config.data = scope.data;
              if (scope.columns !== undefined) config.columns = scope.columns;
              if (scope.headerRow !== undefined) config.headerRow = scope.headerRow;
              if (scope.headerCol !== undefined) config.headerCol = scope.headerCol;
              if (scope.summaryRow !== undefined) config.summaryRow = scope.summaryRow;
              if (scope.className) config.className = scope.className;
              if (scope.sortable !== undefined) config.sortable = scope.sortable;

              return config;
            }

            /**
             * Create the grid
             */
            function createGrid() {
              // Load datagrid module first
              jscModuleLoader.loadDataGrid().then(function() {
                if (!isGridAvailable()) {
                  console.error('JSC.Grid is not available. Ensure datagrid module is loaded.');
                  return;
                }

                var config = buildConfig();

                try {
                  grid = new JSC.Grid(element[0], config);

                  $timeout(function() {
                    scope.gridInstance = grid;
                    isInitialized = true;
                  });
                } catch (e) {
                  console.error('Error creating Grid:', e);
                }
              }).catch(function(error) {
                console.error('Failed to load datagrid module:', error);
              });
            }

            /**
             * Update the grid
             */
            function updateGrid(options) {
              if (grid && typeof grid.options === 'function') {
                try {
                  grid.options(options);
                } catch (e) {
                  console.warn('Error updating Grid:', e);
                }
              }
            }

            // Watch for data changes
            scope.$watch('data', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateGrid({ data: newVal });
              }
            }, true);

            // Watch for columns changes
            scope.$watch('columns', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateGrid({ columns: newVal });
              }
            }, true);

            // Watch for options changes
            scope.$watch('options', function(newVal, oldVal) {
              if (!angular.equals(newVal, oldVal) && isInitialized) {
                updateGrid(buildConfig());
              }
            }, true);

            // Cleanup
            scope.$on('$destroy', function() {
              if (grid && typeof grid.dispose === 'function') {
                grid.dispose();
              } else if (grid && typeof grid.destroy === 'function') {
                grid.destroy();
              }
              grid = null;
              scope.gridInstance = null;
            });

            // Initialize
            createGrid();
          }
        };
      }
    ]);

})(angular);
