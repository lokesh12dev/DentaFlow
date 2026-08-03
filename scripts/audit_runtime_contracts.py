from audit_common import *

a = Audit('runtime-contracts')
package = json.loads(text('package.json'))
required_scripts = ['start','android','ios','web','typecheck','test:domain','audit','verify','build:preview','build:production','supabase:push','supabase:functions']
for script in required_scripts:
    a.require(script in package.get('scripts', {}), 'package-script', f'Missing executable package script: {script}', 'package.json', severity='high')

required_env = ['EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY','EXPO_PUBLIC_ENABLE_DEMO_MODE','EXPO_PUBLIC_PREFER_PROVIDER_MESSAGING']
env = text('.env.example')
for key in required_env:
    a.require(key in env, 'public-env-contract', f'Missing public environment variable {key}', '.env.example', severity='high')
for key in ['SUPABASE_SERVICE_ROLE_KEY','OPENROUTER_API_KEY','WHATSAPP_ACCESS_TOKEN','TWILIO_AUTH_TOKEN']:
    a.require(f'EXPO_PUBLIC_{key}' not in env, 'secret-boundary', f'Server secret is exposed as a mobile public variable: {key}', '.env.example', severity='critical')

portal = ['patient-portal/index.html','patient-portal/app.js','patient-portal/styles.css','patient-portal/config.example.js']
for item in portal:
    a.require((ROOT/item).exists(), 'patient-portal', f'Missing patient portal asset {item}', item, severity='high')
portal_js = text('patient-portal/app.js')
for endpoint in ['public-booking','patient-intake-submit','patient-appointment-response']:
    a.require(endpoint in portal_js, 'portal-endpoint', f'Portal does not call {endpoint}', 'patient-portal/app.js', severity='high')
a.require('SUPABASE_SERVICE_ROLE_KEY' not in portal_js, 'portal-secret', 'Patient portal contains a service role key reference', 'patient-portal/app.js', severity='critical')

source = '\n'.join(p.read_text(errors='ignore') for p in files('src/**/*.ts') + files('src/**/*.tsx') + files('app/**/*.tsx'))
for token in ['TODO:', 'FIXME:', 'REPLACE_WITH_YOUR_EAS_PROJECT_ID']:
    count = source.count(token)
    if count: a.add('medium','unfinished-marker',f'{count} unfinished marker(s): {token}','src/app')
for pattern, label in [(r'onPress=\{\(\)\s*=>\s*\{?\s*\}?\}', 'empty action'), (r'throw new Error\(["\']Not implemented', 'not implemented exception')]:
    count = len(re.findall(pattern, source, re.I))
    a.require(count == 0, 'dead-runtime-path', f'Found {count} {label}(s)', 'src/app', severity='critical')

# Every provider function must use the shared CORS/error envelope.
edge_files = files('supabase/functions/*/index.ts')
for p in edge_files:
    body = p.read_text(errors='ignore')
    a.require('preflight' in body and 'handleError' in body, 'edge-envelope', f'{p.parent.name} lacks shared preflight/error handling', str(p.relative_to(ROOT)), severity='high')

# Production mode must be strict about missing credentials while demo remains explicit.
core_env = text('src/core/env.ts')
a.require('demoMode' in core_env and 'EXPO_PUBLIC_ENABLE_DEMO_MODE' in core_env, 'demo-mode', 'Demo mode is not explicit', 'src/core/env.ts', severity='high')
a.require('assertProductionConfig' in core_env or 'configurationErrors' in core_env, 'credential-validation', 'Production credential validation is missing', 'src/core/env.ts', severity='high')

a.metrics = {
    'package_scripts': len(package.get('scripts', {})),
    'edge_functions': len(edge_files),
    'portal_assets': sum((ROOT/x).exists() for x in portal),
    'routes': len(files('app/**/*.tsx')),
    'source_markers': sum(source.count(x) for x in ['TODO:','FIXME:'])
}
dump(a.report(), 'runtime-contracts.json')
