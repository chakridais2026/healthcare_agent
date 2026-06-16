import { createApp, lakebase, server } from '@databricks/appkit';
import { setupFacilitiesRoutes } from './routes/healthcare/facilities-routes';
import { setupHealthIndicatorsRoutes } from './routes/healthcare/health-indicators-routes';
import { setupPincodeRoutes } from './routes/healthcare/pincode-routes';

createApp({
  plugins: [lakebase(), server()],
  async onPluginsReady(appkit) {
    setupFacilitiesRoutes(appkit);
    setupHealthIndicatorsRoutes(appkit);
    setupPincodeRoutes(appkit);
  },
}).catch(console.error);
