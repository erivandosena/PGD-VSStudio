import { EnvironmentService } from './environment.service';

export const EnvServiceFactory = () => {  
  // Create env
  const environment = new EnvironmentService();

  // Read environment variables from browser window
  const browserWindow = window || {};
  const browserWindowEnv = browserWindow['__env'] || {};

  // Assign environment variables from browser window to env
  // In the current implementation, properties from env.js overwrite defaults from the EnvService.
  // If needed, a deep merge can be performed here to merge properties instead of overwriting them.
  for (const key in browserWindowEnv) {
    if (browserWindowEnv.hasOwnProperty(key)) {
        environment[key] = window['__env'][key];
    }
  }

  return environment;
};

export const EnvServiceProvider = {  
  provide: EnvironmentService,
  useFactory: EnvServiceFactory,
  deps: [],
};
