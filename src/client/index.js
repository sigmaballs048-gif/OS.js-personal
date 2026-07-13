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

// Import the compiled package data directly
import metadata from '../../dist/metadata.json'; 

const init = () => {
  const osjs = new Core({
    ...config,
    standalone: true, // Strictly enforces client-side only mode
    
    // Inject the raw metadata object to prevent OS.js from attempting an HTTP fetch
    packages: {
      ...(config.packages || {}),
      manifest: metadata 
    },

    desktop: {
      ...(config.desktop || {}),
      settings: {
        ...(config.desktop?.settings || {}),
        background: {
          type: 'image',
          src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920'
        }
      }
    }
  }, {});

  // Force local environment settings to prevent server sync
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register all core providers normally
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // Boot the OS and launch the panel layout
  osjs.boot()
    .then(() => {
      console.log('Core initialized natively. Launching workspace panels...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('System failed to initialize desktop:', err));
};

window.addEventListener('DOMContentLoaded', () => init());