// src/client/github-vfs.js

const GITHUB_API = "https://api.github.com";

async function githubRequest(path, options = {}, token) {
  // Cleans up double slashes in paths
  const cleanPath = path.replace(/^github:\/\//, '').replace(/^\//, '');
  const url = `${GITHUB_API}/repos/${options.owner}/${options.repo}/contents/${cleanPath}`;
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers
    },
    body: options.body
  });

  if (!response.ok) {
    throw new Error(`GitHub VFS Error: ${response.statusText}`);
  }
  return response.json();
}

const githubAdapter = (core) => {
  const getToken = () => localStorage.getItem('gh_token');
  // CHANGE THESE to your own GitHub username and your blank storage repository name
  const repoInfo = { owner: 'sigmaballs048-gif', repo: 'osjs-storage' };

  return {
    readdir: async (file) => {
      try {
        const data = await githubRequest(file.path, repoInfo, getToken());
        const list = Array.isArray(data) ? data : [data];
        return list.map(item => ({
          filename: item.name,
          path: `github:///${item.path}`,
          type: item.type === 'dir' ? 'dir' : 'file',
          size: item.size,
          mime: item.type === 'dir' ? null : 'text/plain'
        }));
      } catch (e) {
        return [];
      }
    },

    readfile: async (file, options) => {
      const data = await githubRequest(file.path, repoInfo, getToken());
      const binaryString = atob(data.content.replace(/\s/g, ''));
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    },

    writefile: async (file, data) => {
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Content = btoa(binary);

      let sha;
      try {
        const existing = await githubRequest(file.path, repoInfo, getToken());
        sha = existing.sha;
      } catch (e) {}

      return githubRequest(file.path, {
        method: 'PUT',
        ...repoInfo,
        body: JSON.stringify({
          message: `OS.js saved: ${file.filename}`,
          content: base64Content,
          sha: sha
        })
      }, getToken());
    }
  };
};

export default githubAdapter;