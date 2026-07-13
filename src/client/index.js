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

import { Core } from '@osjs/client';
import { CoreServiceProvider, SettingsServiceProvider } from '@osjs/client';
import githubAdapter from './github-vfs.js';

const init = () => {
  const osjs = new Core({
    standalone: true
  });

  // Register Core services and Settings storage
  osjs.register(CoreServiceProvider);
  osjs.register(SettingsServiceProvider, { instantiate: true });

  // Hook into the configuration filesystem registry before booting
  osjs.on('init', () => {
    osjs.register('osjs/fs', (fs) => ({
      adapters: {
        github: githubAdapter(osjs)
      }
    }));
  });

  // Boot up the desktop environment
  osjs.boot();
};

window.addEventListener('DOMContentLoaded', () => init());