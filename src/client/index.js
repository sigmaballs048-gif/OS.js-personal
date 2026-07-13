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
    standalone: false, // Leave server mode active to preserve asset routers

    // 1. SILENCE THE WEBSOCKET FAULT
    // Providing blank link settings blocks OS.js from connecting to real-time sync systems
    ws: {
      ...(config.ws || {}),
      connect: false
    },
    
    http: {
      ...(config.http || {}),
      base: '/api'
    }
  }, {});

  // Direct configuration states strictly to the client storage engine
  osjs.register(SettingsServiceProvider, {
    before: true,
    args: { adapter: 'localStorage' }
  });
  
  // Register basic core handlers
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  osjs.register(VFSServiceProvider, {
    args: { adapters: { github: githubAdapter } }
  });

  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // 2. FORCE SYSTEM PANEL DATA REGISTRATION
  // Inject the required panel object metadata block directly into the package service memory
  const originalBoot = osjs.boot.bind(osjs);
  osjs.boot = async function() {
    if (osjs.has('osjs/packages')) {
      const packageService = osjs.make('osjs/packages');
      
      // Fetch structural arrays already registered inside the context layer
      let list = packageService.packages || [];
      
      const hasPanels = list.some(p => p.name === '@osjs/panels');
      if (!hasPanels) {
        console.log('Registering missing @osjs/panels structural layout metadata...');
        list.push({
          name: '@osjs/panels',
          type: 'application',
          singleton: true,
          title: { en_EN: 'Panels' },
          description: { en_EN: 'OS.js Workspace Panels' },
          files: ['main.js', 'main.css']
        });
      }
      
      // Synchronize modified mapping properties right back into the core registry
      packageService.packages = list;
      packageService.getPackages = () => [...list];
      packageService.getPackage = (name) => list.find(p => p.name === name);
      packageService.getCompatiblePackages = () => [...list];
    }
    return originalBoot();
  };

  // Launch workspace UI
  osjs.boot()
    .then(() => {
      console.log('OS.js core operational. Instantiating desktop layers...');
      return osjs.run('@osjs/panels');
    })
    .catch((err) => console.error('Desktop initialization failed:', err));
};

window.addEventListener('DOMContentLoaded', () => init());