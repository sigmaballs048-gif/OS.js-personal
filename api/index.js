// api/index.js
import fs from 'fs';
import path from 'path';

export default async function handler(request, response) {
  // Enable CORS so the frontend doesn't block the request
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // Locate and read your dist/metadata.json file dynamically on the serverless container
    const metadataPath = path.join(process.cwd(), 'dist', 'metadata.json');
    let rawData = fs.readFileSync(metadataPath, 'utf8');
    let packageManifest = JSON.parse(rawData);
    
    // Fallback: convert to array if it built as an object map
    if (!Array.isArray(packageManifest)) {
      packageManifest = Object.values(packageManifest);
    }

    // Force inject the core structural panel metadata if it isn't compiled in
    if (!packageManifest.some(pkg => pkg.name === '@osjs/panels')) {
      packageManifest.push({
        name: '@osjs/panels',
        type: 'application',
        singleton: true,
        title: { en_EN: 'Panels' },
        description: { en_EN: 'OS.js Desktop Panels' },
        files: ['main.js', 'main.css']
      });
    }

    // OS.js expects an array of packages when fetching from the api route
    return response.status(200).json(packageManifest);
  } catch (error) {
    console.error('Serverless backend error:', error);
    return response.status(500).json({ error: 'Failed to parse package registry' });
  }
}