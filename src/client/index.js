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

  // 1. Pre-fetch package configuration array structures
  try {
    const response = await fetch('metadata.json');
    const data = await response.json();
    packageManifest = Array.isArray(data) ? data : Object.values(data);
    
    // Inject structural panels fallback schema cleanly
    if (!packageManifest.some(pkg => pkg.name === '@osjs/panels')) {
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
    console.error('Failed processing metadata map:', error);
  }

  const osjs = new Core({
    ...config,
    standalone: false, // Maintain standard framework registry behaviors
    ws: { connect: false } // Blocks WebSocket execution workflows completely
  }, {});

  // Force local state retention
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register basic core dependencies
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // 2. HTTP NETWORKING INTERCEPTION
  // We re-bind the base HTTP handler immediately before booting. Whenever OS.js
  // attempts to query any backend API URL, it gets directed straight to our manifest array.
  osjs.instance.bind('osjs/http', () => {
    return {
      request: (options) => {
        console.log(`Intercepted core HTTP operation targeting: ${options.url}`);
        return Promise.resolve(packageManifest);
      },
      // Keep basic asset mappings pointing to local directories
      url: (url) => url,
      createUrl: (url) => url
    };
  });

  // 3. PACKAGE REPOSITORY CONTEXT HYDRATION
  // Force internal registry targets to reflect the custom manifest array natively
  const originalBoot = osjs.boot.bind(osjs);
  osjs.boot = async function() {
    if (osjs.has('osjs/packages')) {
      const packageService = osjs.make('osjs/packages');
      packageService.packages = packageManifest;
      packageService.getPackages = () => [...packageManifest];
      packageService.getPackage = (name) => packageManifest.find(p => p.name === name);
      packageService.getCompatiblePackages = () => [...packageManifest];
    }
    return originalBoot();
  };

  // Launch frontend desktop environments
  osjs.boot()
    .then(() => {
      console.log('OS.js Connected successfully to decoupled environment pipeline.');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

window.addEventListener('DOMContentLoaded', () => init());