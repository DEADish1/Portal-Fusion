const fs = require('fs');
const path = require('path');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const distRoot = path.join(projectRoot, 'dist');
  const legacyRoot = path.join(distRoot, 'apps', 'desktop', 'src');
  const rendererSrc = path.join(projectRoot, 'src', 'renderer');
  const rendererDest = path.join(distRoot, 'renderer');

  if (fs.existsSync(legacyRoot)) {
    const entries = fs.readdirSync(legacyRoot, { withFileTypes: true });
    for (const entry of entries) {
      const src = path.join(legacyRoot, entry.name);
      const dest = path.join(distRoot, entry.name);
      fs.rmSync(dest, { recursive: true, force: true });
      if (entry.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }

    const legacyAppsDir = path.join(distRoot, 'apps');
    fs.rmSync(legacyAppsDir, { recursive: true, force: true });
    console.log('Flattened desktop dist to', distRoot);
  } else {
    console.log('No legacy output found at', legacyRoot);
  }

  if (fs.existsSync(rendererSrc)) {
    fs.rmSync(rendererDest, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(rendererDest), { recursive: true });
    fs.cpSync(rendererSrc, rendererDest, { recursive: true });
    console.log('Copied renderer assets to', rendererDest);
  } else {
    console.warn('Renderer source not found at', rendererSrc);
  }
}

main().catch((err) => {
  console.error('[post-compile] failed:', err);
  process.exitCode = 1;
});
