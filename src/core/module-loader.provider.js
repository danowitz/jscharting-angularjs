/**
 * JSCharting AngularJS Module Loader Provider
 *
 * Handles lazy loading of JSCharting modules (maps.js, types.js, etc.)
 * based on chart type requirements.
 */
(function(angular) {
  'use strict';

  angular.module('jsc.angular.core')
    .provider('jscModuleLoader', function() {

      // Base URL for JSCharting modules
      var baseUrl = '../JSC/';

      // Track loaded modules
      var loadedModules = {};

      // Map chart types to required modules
      var moduleMap = {
        // Map charts require maps module
        'map': 'modules/maps.js',

        // Specialty chart types require types module
        'organizational': 'modules/types.js',
        'gantt': 'modules/types.js',
        'calendar': 'modules/types.js',
        'treemap': 'modules/types.js',
        'chord': 'modules/types.js',
        'sankey': 'modules/types.js',
        'heatmap': 'modules/types.js',
        'radar': 'modules/types.js',
        'polar': 'modules/types.js',
        'funnel': 'modules/types.js',
        'pyramid': 'modules/types.js',
        'venn': 'modules/types.js',
        'wordcloud': 'modules/types.js',
        'circular': 'modules/types.js'
      };

      /**
       * Set the base URL for JSCharting modules
       * @param {string} url - The base URL
       */
      this.setBaseUrl = function(url) {
        baseUrl = url;
        if (baseUrl && !baseUrl.endsWith('/')) {
          baseUrl += '/';
        }
      };

      /**
       * Add or update a module mapping
       * @param {string} type - Chart type
       * @param {string} module - Module path (relative to baseUrl)
       */
      this.addModuleMapping = function(type, module) {
        moduleMap[type.toLowerCase()] = module;
      };

      /**
       * Get all module mappings
       * @returns {Object} Module mappings
       */
      this.getModuleMappings = function() {
        return angular.copy(moduleMap);
      };

      this.$get = ['$q', '$document', function($q, $document) {

        /**
         * Load a script dynamically
         * @param {string} src - Script source URL
         * @returns {Promise} Resolves when loaded
         */
        function loadScript(src) {
          var deferred = $q.defer();
          var fullSrc = baseUrl + src;

          // Already loaded
          if (loadedModules[src]) {
            deferred.resolve();
            return deferred.promise;
          }

          // Check if script already exists in DOM
          var existingScripts = document.querySelectorAll('script[src="' + fullSrc + '"]');
          if (existingScripts.length > 0) {
            loadedModules[src] = true;
            deferred.resolve();
            return deferred.promise;
          }

          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = fullSrc;
          script.async = true;

          script.onload = function() {
            loadedModules[src] = true;
            deferred.resolve();
          };

          script.onerror = function() {
            deferred.reject('Failed to load module: ' + fullSrc);
          };

          document.head.appendChild(script);
          return deferred.promise;
        }

        /**
         * Extract the base chart type from a type string
         * @param {string} type - Full chart type string
         * @returns {string} Base type
         */
        function extractBaseType(type) {
          if (!type) {
            return null;
          }

          // Type can contain multiple modifiers: "horizontal column solid"
          // Extract the first word that matches a known type
          var parts = type.toLowerCase().split(/\s+/);

          for (var i = 0; i < parts.length; i++) {
            if (moduleMap[parts[i]]) {
              return parts[i];
            }
          }

          return parts[0];
        }

        return {
          /**
           * Load modules required for a chart type
           * @param {string} type - Chart type
           * @returns {Promise} Resolves when modules are loaded
           */
          loadForType: function(type) {
            if (!type) {
              return $q.resolve();
            }

            var baseType = extractBaseType(type);
            var module = moduleMap[baseType];

            if (module && !loadedModules[module]) {
              return loadScript(module);
            }

            return $q.resolve();
          },

          /**
           * Preload specific modules
           * @param {Array<string>} modules - Module paths to load
           * @returns {Promise} Resolves when all modules are loaded
           */
          preload: function(modules) {
            var promises = modules.map(function(mod) {
              return loadScript(mod);
            });
            return $q.all(promises);
          },

          /**
           * Load the toolbar module
           * @returns {Promise}
           */
          loadToolbar: function() {
            return loadScript('modules/toolbar.js');
          },

          /**
           * Load the data grid module
           * @returns {Promise}
           */
          loadDataGrid: function() {
            return loadScript('modules/datagrid.js');
          },

          /**
           * Load the maps module
           * @returns {Promise}
           */
          loadMaps: function() {
            return loadScript('modules/maps.js');
          },

          /**
           * Load the types module
           * @returns {Promise}
           */
          loadTypes: function() {
            return loadScript('modules/types.js');
          },

          /**
           * Load the accessibility module
           * @returns {Promise}
           */
          loadAccessibility: function() {
            return loadScript('modules/accessibility.js');
          },

          /**
           * Check if a module is loaded
           * @param {string} module - Module path
           * @returns {boolean}
           */
          isLoaded: function(module) {
            return !!loadedModules[module];
          },

          /**
           * Get the base URL
           * @returns {string}
           */
          getBaseUrl: function() {
            return baseUrl;
          },

          /**
           * Set the base URL at runtime
           * @param {string} url - The base URL
           */
          setBaseUrl: function(url) {
            baseUrl = url;
            if (baseUrl && !baseUrl.endsWith('/')) {
              baseUrl += '/';
            }
          }
        };
      }];
    });

})(angular);
