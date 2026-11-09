#!/usr/bin/env python
# -*- coding: utf-8 -*-

with open('src/views/admin/Dashboard.vue', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# Find style section
in_style = False
style_start = 0
for i, line in enumerate(lines):
    if '<style scoped lang="scss">' in line:
        in_style = True
        style_start = i + 1  # Start from next line
        break

# Check braces in style section (only outside of comments and strings)
brace_count = 0
for i, line in enumerate(lines[style_start:], start=1):
    # Simple check - count all { and }
    # Skip lines that are comments
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
        continue
    
    for char in line:
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
    
    if brace_count < 0:
        print(f'Extra closing brace at style line {i} (file line {style_start + i})')
        print(f'Content: [{line}]')
        brace_count = 0  # Reset to continue checking

print(f'Total brace balance: {brace_count} (should be 0)')

# Re-check and print lines around 310
brace_count = 0
for i, line in enumerate(lines[style_start:], start=1):
    for char in line:
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
    if i >= 305 and i <= 315:
        print(f'Line {i}: brace_count={brace_count}, content=[{line}]')
