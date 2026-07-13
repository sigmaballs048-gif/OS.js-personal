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

const init = () => {
  const osjs = new Core({
    standalone: true,
    // Provide explicit metadata configurations to completely bypass standalone network fetch errors
    packages: {
      metadata: [
        {
          name: 'StandardTheme',
          type: 'theme',
          category: 'system',
          title: { en_EN: 'Standard Theme' },
          description: { en_EN: 'Standard Theme' }
        }
      ]
    }
  });

  // 1. Register configurations before UI rendering starts
  osjs.register(SettingsServiceProvider, { before: true });
  
  // 2. Load core UI layer engines
  osjs.register(CoreServiceProvider);
  osjs.register(DesktopServiceProvider);
  
  // 3. Register filesystem and attach your customized github storage module
  osjs.register(VFSServiceProvider, {
    args: {
      adapters: {
        github: githubAdapter
      }
    }
  });

  // 4. Load background communication services
  osjs.register(NotificationServiceProvider);
  osjs.register(AuthServiceProvider);

  // 5. Fire up the desktop interface
  osjs.boot();
};

window.addEventListener('DOMContentLoaded', () => init());