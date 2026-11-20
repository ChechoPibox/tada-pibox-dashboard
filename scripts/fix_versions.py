import re

# Fix version tags in index.html
path = r'c:\Users\Digital\.gemini\antigravity-ide\scratch\tada-pibox-dashboard\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all version patterns
hits = re.findall(r'\?v=[^"&\' ]+', content)
unique = list(set(hits))
print('Version strings found:', unique[:20])

# Replace all version tags with v109
content2 = re.sub(r'\?v=20261120_v10[0-9]', '?v=20261120_v109', content)
n_replaced = len(re.findall(r'\?v=20261120_v10[0-9]', content))
print(f'Replaced {n_replaced} version tags -> v109')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content2)

print('Done.')
