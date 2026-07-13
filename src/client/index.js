/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

//
// This is the client bootstrapping script.
// This is where you can register service providers or set up
// your libraries etc.
//
// https://manual.os-js.org/guide/provider/
// https://manual.os-js.org/install/
// https://manual.os-js.org/resource/official/
//

// src/client/index.js
// src/client/index.js

// src/client/index.js

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
import config from './config.js'; // Crucial: Imports the default OS.js core settings

const init = () => {
  // Safely merge the default configuration with our standalone overrides
  const osjs = new Core({
    ...config,
    standalone: true,
    
    // Explicitly seed the metadata definitions to prevent outbound HTTP requests
    packages: {
      metadata: [
        {
          name: 'StandardTheme',
          type: 'theme',
          category: 'system',
          title: { en_EN: 'Standard Theme' }
        },
        {
          name: 'GnomeIcons',
          type: 'icons',
          category: 'system',
          title: { en_EN: 'Gnome Icons' }
        },
        {
          name: 'FreedesktopSounds',
          type: 'sounds',
          category: 'system',
          title: { en_EN: 'Freedesktop Sounds' }
        }
      ]
    },

    // Point the desktop background directly to an external URL to bypass the 404
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

  // Register settings layer
  osjs.register(SettingsServiceProvider, { before: true });
  
  // Register basic UI layer services
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  // Register file management and inject the custom GitHub adapter
  osjs.register(VFSServiceProvider, {
    args: {
      adapters: {
        github: githubAdapter
      }
    }
  });

  // Register background system utilities
  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // Boot the web desktop interface
  osjs.boot();
};

window.addEventListener('DOMContentLoaded', () => init());