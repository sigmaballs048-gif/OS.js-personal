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

const init = async () => {
  // 1. Fetch the manifest natively to completely bypass OS.js internal HTTP blockers
  let packageManifest = [];
  try {
    console.log('Fetching system metadata manually...');
    const response = await fetch('metadata.json');
    const data = await response.json();
    
    // Ensure the manifest is cleanly formatted as an array for OS.js
    packageManifest = Array.isArray(data) ? data : Object.values(data);
    console.log(`Successfully loaded ${packageManifest.length} packages from server.`);
  } catch (error) {
    console.error('Failed to fetch metadata.json manually:', error);
  }

  // 2. Initialize Core with the pre-fetched manifest array
  const osjs = new Core({
    ...config,
    standalone: true, // Strictly enforces client-side mode
    packages: {
      ...(config.packages || {}),
      manifest: packageManifest // Inject the raw data we just fetched
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

  // Force local environment storage settings
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
      console.log('OS.js Native Boot Complete. Launching panels...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

// Wait for the DOM, then run our async initialization
window.addEventListener('DOMContentLoaded', () => init());