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

  // 1. Pre-load your packages definition from the static file
  try {
    const response = await fetch('/metadata.json');
    const data = await response.json();
    packageManifest = Array.isArray(data) ? data : Object.values(data);
    
    // Inject the structural desktop layout definition directly into our array
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

  // 2. Setup the Core with deep configuration overrides
  const osjs = new Core({
    ...config,
    standalone: false,
    
    // Provide the manifest directly so OS.js treats it as a pre-loaded local registry
    packages: {
      ...(config.packages || {}),
      manifest: packageManifest,
      entries: packageManifest,
      discover: () => Promise.resolve(packageManifest)
    }
  }, {});

  // 3. STUB WEBSOCKETS TO PREVENT THE 1006 CRASH
  // This completely stops the engine from attempting to create a 'wss://' link
  osjs.instance.bind('osjs/websocket', () => ({
    on: () => {},
    emit: () => {},
    create: () => ({ on: () => {}, emit: () => {}, close: () => {} }),
    wrapper: { cookies: () => Promise.resolve({}) }
  }));

  // Direct configuration states strictly to local browser memory
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register basic core providers
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // 4. OVERRIDE NETWORK INJECTOR
  // Force the package service layer to yield our combined array every time
  const originalBoot = osjs.boot.bind(osjs);
  osjs.boot = async function() {
    if (osjs.has('osjs/packages')) {
      const packageService = osjs.make('osjs/packages');
      packageService.packages = packageManifest;
      packageService.getPackages = () => [...packageManifest];
      packageService.getPackage = (name) => packageManifest.find(p => p.name === name);
    }
    return originalBoot();
  };

  // Launch the desktop workspace environment
  osjs.boot()
    .then(() => {
      console.log('OS.js connected and stabilized. Booting panels...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

window.addEventListener('DOMContentLoaded', () => init());