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
  let packageManifest = [];

  try {
    console.log('Fetching system metadata manually...');
    const response = await fetch('metadata.json');
    const data = await response.json();
    
    // OS.js package service expects an array of metadata objects.
    // If your build output targets a dictionary mapping, convert it here.
    packageManifest = Array.isArray(data) ? data : Object.values(data);
    console.log(`Loaded metadata containing ${packageManifest.length} entries.`);
  } catch (error) {
    console.error('Failed to pre-load system manifest metadata:', error);
  }

  const osjs = new Core({
    ...config,
    standalone: true, // Blocks external request chains
    
    // Explicitly configure the core package system to use the local list natively
    packages: {
      ...(config.packages || {}),
      manifest: packageManifest,
      registry: packageManifest, // Duplicate target to satisfy internal package registry fallbacks
      discover: () => Promise.resolve(packageManifest) // Overrides background discovery checks
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

  // Force local storage environments to disable user backend syncs
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register necessary systems
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // Boot OS.js and explicitly invoke the layout panel
  osjs.boot()
    .then(() => {
      console.log('OS.js Native Boot Complete. Launching panels...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

window.addEventListener('DOMContentLoaded', () => init());