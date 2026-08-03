from audit_common import *
a=Audit('ux-and-design-system')
source='\n'.join(p.read_text(errors='ignore') for p in files('src/**/*.tsx')+files('src/**/*.ts'))
for pattern,label in [(r'LinearGradient|expo-linear-gradient','gradient dependency'),(r'#[A-Fa-f0-9]{6}[^\n]*(purple|violet)|purple|violet','unapproved purple/violet'),(r'[😀-🙏🌀-🫿]','emoji icon')]:
    matches=re.findall(pattern,source,re.I)
    a.require(not matches,'visual-discipline',f'Found {label}: {len(matches)} occurrence(s)','src',severity='high')
tokens='\n'.join(text(path) for path in ['design-system/tokens.ts','design-system/spacing.ts','design-system/radii.ts','design-system/typography.ts','design-system/motion.ts','design-system/elevation.ts'])
for token in ['palette','spacing','radii','sizes','typography','fonts']:a.require(token in tokens,'design-token',f'Missing {token} token','design-system')
a.require(re.search(r'touch:\s*44',tokens) is not None and 'sizes.touch' in source,'touch-target','44px touch token is missing or unused','design-system/radii.ts',severity='high')
tab=text('app/(tabs)/_layout.tsx')
tab_count=len(re.findall(r'<Tabs\.Screen',tab))
a.require(tab_count==5,'navigation-load',f'Primary navigation has {tab_count} tabs; expected exactly 5','app/(tabs)/_layout.tsx')
icons=text('src/ui/icons.ts');a.require('lucide-react-native' in icons,'icon-system','Lucide icon system not found','src/ui/icons.ts')
# Detect obvious empty handlers and inaccessible Pressables.
for p in files('src/**/*.tsx'):
    body=p.read_text(errors='ignore')
    if re.search(r'onPress=\{\(\)\s*=>\s*(undefined|null)\}',body):a.add('critical','dead-action','Empty press handler found',str(p.relative_to(ROOT)))
    for m in re.finditer(r'<Pressable\b([^>]*)>',body,re.S):
        attrs=m.group(1)
        if 'accessibilityRole' not in attrs and 'accessible={false}' not in attrs:a.add('medium','pressable-accessibility','Pressable lacks accessibilityRole',str(p.relative_to(ROOT)))
a.metrics={'primary_tabs':tab_count,'tsx_screens':len(files('src/features/**/*.tsx')),'component_count':len(files('src/ui/components/*.tsx')),'gradient_matches':len(re.findall(r'LinearGradient|expo-linear-gradient',source))}
dump(a.report(),'ux.json')
