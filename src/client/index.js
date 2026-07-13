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
    
    // Convert dictionary mapping to flat array if necessary
    packageManifest = Array.isArray(data) ? data : Object.values(data);

    // CRITICAL FIX: Explicitly check and inject the structural panel metadata if it's missing
    const hasPanels = packageManifest.some(pkg => pkg.name === '@osjs/panels');
    if (!hasPanels) {
      console.log('Injecting missing @osjs/panels metadata into local memory...');
      packageManifest.push({
        name: '@osjs/panels',
        type: 'application',
        singleton: true,
        title: { en_EN: 'Panels' },
        description: { en_EN: 'OS.js Desktop Panels' },
        files: ['main.js', 'main.css'] // Standard entry points for the package loader
      });
    }

    console.log(`Loaded metadata containing ${packageManifest.length} entries.`);
  } catch (error) {
    console.error('Failed to pre-load system manifest metadata:', error);
  }

  const osjs = new Core({
    ...config,
    standalone: true, // Prevents any internal backend requests
    
    // Provide entries array straight to the Core service configuration
    packages: {
      ...(config.packages || {}),
      entries: packageManifest
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

  // Direct state to localStorage
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register engine requirements
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // Boot up the framework interface
  osjs.boot()
    .then(() => {
      console.log('OS.js Native Boot Complete. Launching workspace panels...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

window.addEventListener('DOMContentLoaded', () => init());