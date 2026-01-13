const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve JSCharting resources at /JSC (for module loader)
app.use('/JSC', express.static(path.join(__dirname, 'node_modules/jscharting/dist')));

// Serve static files from the project root
app.use(express.static(__dirname));

// Serve node_modules for dependencies
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve dist folder
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Serve examples folder
app.use('/examples', express.static(path.join(__dirname, 'examples')));

// Redirect root to examples index
app.get('/', (req, res) => {
  res.redirect('/examples/');
});

app.listen(PORT, () => {
  console.log(`JSCharting AngularJS Examples Server`);
  console.log(`------------------------------------`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Examples available at http://localhost:${PORT}/examples/`);
  console.log(`\nPress Ctrl+C to stop the server`);
});
