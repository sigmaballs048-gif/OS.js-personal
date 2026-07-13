import {
  Core,
  CoreServiceProvider,
  DesktopServiceProvider,
  VFSServiceProvider,
  NotificationServiceProvider,
  SettingsServiceProvider,
  AuthServiceProvider
} from '@osjs/client';
import githubAdapter from './github-vfs.js';
import config from './config.js';

const init = () => {
  const osjs = new Core({
    ...config,
    standalone: false, // Turn standalone mode OFF so it uses your serverless backend!
    
    // Tell the system where your API roots are relative to your deployment domain
    http: {
      ...(config.http || {}),
      base: '/api'
    }
  }, {});

  // Force local storage environments for user desktop states
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register basic core providers normally
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // Boot standard engine pipelines
  osjs.boot()
    .then(() => {
      console.log('OS.js connected to serverless API backend. Booting UI...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

window.addEventListener('DOMContentLoaded', () => init());