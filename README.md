# JSCharting AngularJS Wrapper

Comprehensive AngularJS (1.8.x) wrapper for JSCharting v3.4 that exposes all 150+ chart types through AngularJS directives and services.

## Installation

1. Include AngularJS 1.8.x
2. Include JSCharting library (`jscharting.js`)
3. Include this wrapper (`jscharting-angularjs.js`)

```html
<script src="angular.js"></script>
<script src="jscharting/JSC/jscharting.js"></script>
<script src="jscharting-angularjs/dist/jscharting-angularjs.js"></script>
```

4. Add `jsc.angular` as a dependency to your app:

```javascript
angular.module('myApp', ['jsc.angular']);
```

## Quick Start

### Basic Line Chart

```html
<jsc-chart
  jsc-type="line"
  jsc-options="vm.chartConfig"
  jsc-series="vm.data"
  jsc-on-point-click="vm.onPointClick(point)">
</jsc-chart>
```

```javascript
angular.module('myApp', ['jsc.angular'])
  .controller('DemoCtrl', function() {
    var vm = this;

    vm.chartConfig = {
      title: { label: { text: 'Sales Report' } },
      legend: { position: 'bottom' }
    };

    vm.data = [{
      name: 'Revenue',
      points: [['Q1', 100], ['Q2', 120], ['Q3', 140], ['Q4', 180]]
    }];

    vm.onPointClick = function(point) {
      console.log('Clicked:', point.name);
    };
  });
```

## Available Directives

### Main Chart Directive

`<jsc-chart>` - Supports all 150+ chart types

**Attributes:**
- `jsc-options` - Full chart configuration object
- `jsc-series` - Series data array
- `jsc-type` - Chart type (e.g., 'line', 'column', 'pie')
- `jsc-palette` - Color palette
- `jsc-title` - Chart title text
- `jsc-legend-position` - Legend position
- `jsc-instance` - Output: chart instance reference

**Events:**
- `jsc-on-load` - Chart loaded
- `jsc-on-point-click` - Point clicked
- `jsc-on-series-click` - Series clicked
- `jsc-on-zoomed` - Chart zoomed
- `jsc-on-point-selection-changed` - Selected points changed

### Specialized Directives

#### Map Chart
```html
<jsc-map
  jsc-map="US"
  jsc-series="vm.stateData"
  jsc-palette="vm.heatmapColors"
  jsc-on-point-click="vm.onStateClick(point)">
</jsc-map>
```

#### Organizational Chart
```html
<jsc-org-chart
  jsc-series="vm.orgData"
  jsc-orientation="vertical"
  jsc-on-point-click="vm.onNodeClick(point)">
</jsc-org-chart>
```

#### Calendar Chart
```html
<jsc-calendar
  jsc-data="vm.calendarData"
  jsc-year="2024"
  jsc-palette="vm.heatmapColors">
</jsc-calendar>
```

#### Gantt Chart
```html
<jsc-gantt
  jsc-series="vm.taskData"
  jsc-show-dependencies="true">
</jsc-gantt>
```

#### Radar Chart
```html
<jsc-radar
  jsc-series="vm.radarData"
  jsc-categories="vm.categories"
  jsc-filled="true">
</jsc-radar>
```

#### Data Grid
```html
<jsc-grid
  jsc-data="vm.tableData"
  jsc-columns="vm.columnConfig"
  jsc-header-row="true">
</jsc-grid>
```

### Widget Directives

#### Circular Gauge
```html
<jsc-circular-widget
  jsc-value="vm.progress"
  jsc-min="0"
  jsc-max="100"
  jsc-label="'Progress'"
  jsc-color="'#4CAF50'">
</jsc-circular-widget>
```

#### Linear Gauge
```html
<jsc-linear-widget
  jsc-value="vm.value"
  jsc-target="80"
  jsc-label="'Performance'">
</jsc-linear-widget>
```

#### Bar/Column Widget
```html
<jsc-bar-column-widget
  jsc-value="vm.values"
  jsc-horizontal="true">
</jsc-bar-column-widget>
```

## Services

### jscChartFactory

Create and manage chart instances:

```javascript
angular.module('myApp')
  .controller('Ctrl', function(jscChartFactory) {
    // Create chart programmatically
    jscChartFactory.create(element, config).then(function(chart) {
      // Chart ready
    });

    // Destroy chart
    jscChartFactory.destroy(chart);
  });
```

### jscDataService

Data loading and transformation:

```javascript
angular.module('myApp')
  .controller('Ctrl', function(jscDataService) {
    // Load CSV data
    jscDataService.fetchCsv('/data/sales.csv').then(function(data) {
      vm.series = jscDataService.nestToSeries(data, {
        keys: ['category'],
        rollup: { property: 'value', calculation: 'sum' }
      });
    });
  });
```

### jscConfigBuilder

Fluent configuration builder:

```javascript
angular.module('myApp')
  .controller('Ctrl', function(jscConfigBuilder) {
    vm.config = jscConfigBuilder.create()
      .type('column')
      .title('Sales Report')
      .palette(['#4CAF50', '#2196F3', '#FF5722'])
      .legend('bottom')
      .series([{ name: 'Sales', points: data }])
      .build();
  });
```

### jscEventService

Cross-chart event communication:

```javascript
angular.module('myApp')
  .controller('Ctrl', function(jscEventService, $scope) {
    // Subscribe to events
    jscEventService.on('chart:zoom', function(data) {
      // Handle zoom event from any chart
    }, $scope);

    // Emit events
    jscEventService.emit('chart:update', { chartId: 'main' });
  });
```

## Configuration (Provider)

Configure global defaults in your app's config phase:

```javascript
angular.module('myApp')
  .config(function(jscConfigProvider, jscModuleLoaderProvider) {
    // Set global defaults
    jscConfigProvider
      .setDebug(true)
      .setPalette(['#1565C0', '#4CAF50', '#FF5722'])
      .setAnimation({ duration: 400 })
      .setDefaultTooltip({ enabled: true });

    // Set JSCharting module base URL
    jscModuleLoaderProvider.setBaseUrl('/lib/jscharting/JSC/');
  });
```

## Building from Source

```bash
# Install dependencies
npm install

# Development build
npm run build

# Production build (minified)
npm run build:prod

# Watch mode
npm run watch
```

## License

MIT

## Support

For JSCharting library support: https://jscharting.com/
For wrapper issues: [GitHub Issues]
