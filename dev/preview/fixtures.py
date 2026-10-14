# Builds tests/zz-fixtures.ts from the mods' exported hub data (/tmp/claude-501/preview/capture-*.json),
# so the hub's preview draws every mod as it ships.
import json, glob, os
out = {}
for path in sorted(glob.glob('/tmp/claude-501/preview/capture-*.json')):
    data = json.load(open(path))
    out[data['noun']] = data
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, '..', '..', 'tests', 'zz-fixtures.ts'), 'w') as f:
    f.write('export const CAPTURES: Record<string, any> = ' + json.dumps(out) + '\n')
print(sorted(out))
