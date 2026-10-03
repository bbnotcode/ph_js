from pathlib import Path
import base64, hashlib, json, subprocess, tempfile, zipfile
from urllib.parse import urlparse, unquote

root = Path(__file__).resolve().parent.parent
index = json.loads((root / 'source-index.json').read_text())
assert index == json.loads((root / 'stripchat-angellive/source-index.json').read_text()), 'Plugin indexes differ'
for plugin in index['plugins']:
    name = unquote(urlparse(plugin['zipURLs'][0]).path.rsplit('/', 1)[-1])
    package = root / name
    assert package.parent == root and package.exists(), 'Missing published package'
    assert hashlib.sha256(package.read_bytes()).hexdigest() == plugin['sha256'], 'Package SHA-256 differs from index'
    with zipfile.ZipFile(package) as archive:
        assert archive.testzip() is None, 'Corrupt published package'
        for file in ['main.js', 'manifest.json']:
            assert archive.read(file) == (root / 'stripchat-angellive' / file).read_bytes(), f'Published {file} differs from source'
        manifest = json.loads(archive.read('manifest.json'))
        assert manifest['version'] == plugin['version'], 'Package version differs from index'

encrypted = (root / 'twitter视频.js').read_text().splitlines()
assert encrypted[0] == 'FWENC2' and len(encrypted) >= 3, 'Invalid encrypted Forward envelope'
header = json.loads(encrypted[1])
assert header['v'] == 2 and header['alg'] == 'A256GCM', 'Unexpected Forward encryption metadata'
assert base64.b64decode(encrypted[2], validate=True), 'Empty Forward payload'
for package in root.glob('*.fwd'):
    with zipfile.ZipFile(package) as archive:
        assert archive.testzip() is None, f'Corrupt {package.name}'
        scripts = {archive.read(info) for info in archive.infolist() if info.filename.endswith('.js')}
        assert scripts, f'No script in {package.name}'
        for script in scripts:
            with tempfile.NamedTemporaryFile(suffix='.js') as temporary:
                temporary.write(script); temporary.flush()
                subprocess.run(['node', '--check', temporary.name], check=True)
print('Published ZIP/index/version, FWENC2 and Forward package checks passed.')
