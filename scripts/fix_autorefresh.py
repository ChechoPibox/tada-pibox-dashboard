path = r'c:\Users\Digital\.gemini\antigravity-ide\scratch\tada-pibox-dashboard\js\app.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines are 0-indexed. Line numbers in output are 1-indexed
# Output shows: 4362 idx=4361, 4363 idx=4362, 4364 idx=4363
# Both idx 4361 and 4362 contain '} catch (err) {'

print('idx 4361:', repr(lines[4361]))
print('idx 4362:', repr(lines[4362]))
print('contains catch:', '} catch' in lines[4361], '} catch' in lines[4362])

# Remove idx 4362 (the second one)
if '} catch' in lines[4361] and '} catch' in lines[4362]:
    del lines[4362]
    print('Removed duplicate. New total:', len(lines))
    for i in range(4359, 4375):
        print(i+1, repr(lines[i][:120]))
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('File written.')
else:
    print('Could not find duplicates at expected positions')
