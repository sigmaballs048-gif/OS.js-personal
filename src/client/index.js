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

  // 1. Load the package metadata cleanly from the static file
  try {
    const response = await fetch('/metadata.json');
    const data = await response.json();
    packageManifest = Array.isArray(data) ? data : Object.values(data);
    
    // Smoothly insert the structural desktop panel block if it is missing
    if (!packageManifest.some(pkg => pkg.name === '@osjs/panels')) {
      console.log('Injecting missing @osjs/panels to local array definition...');
      packageManifest.push({
        name: '@osjs/panels',
        type: 'application',
        singleton: true,
        title: { en_EN: 'Panels' },
        description: { en_EN: 'OS.js Workspace Panels' },
        files: ['main.js', 'main.css']
      });
    }
  } catch (error) {
    console.error('Error parsing metadata.json:', error);
  }

  // 2. Initialize Core with a completely safe configuration footprint
  const osjs = new Core({
    ...config,
    standalone: true // Keeps network lookup workflows strictly local/offline
  }, {});

  // Direct configuration states strictly to local browser storage
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register standard core providers normally
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // 3. SAFE PACKAGE CONTEXT HYDRATION
  // We hook into the boot cycle to supply our data array without breaking config internals
  const originalBoot = osjs.boot.bind(osjs);
  osjs.boot = async function() {
    if (osjs.has('osjs/packages')) {
      const packageService = osjs.make('osjs/packages');
      
      // Seed the internal registries completely
      packageService.packages = packageManifest;
      packageService.getPackages = () => [...packageManifest];
      packageService.getPackage = (name) => packageManifest.find(p => p.name === name);
      packageService.getCompatiblePackages = () => [...packageManifest];
    }
    return originalBoot();
  };

  // Launch your workspace interface
  osjs.boot()
    .then(() => {
      console.log('OS.js connected and stabilized. Booting panels...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

window.addEventListener('DOMContentLoaded', () => init());