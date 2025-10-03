#!/usr/bin/env python3
import re

# Read the file
with open('reportGenerator.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Define comprehensive emoji replacements
# Format: (emoji_pattern, replacement)
replacements = [
    # Shield emojis in headers
    (r'???????\s*VOLTAXE SECURITY REPORT', 'VOLTAXE SECURITY REPORT'),
    (r'??????\s*VOLTAXE SECURITY REPORT', 'VOLTAXE SECURITY REPORT'),
    
    # Cover page shield
    (r"pdf\.text\('???????',", "pdf.text('[SHIELD]',"),
    (r"pdf\.text\('\[SHIELD\]',\s*15,\s*25\);", "pdf.text('[SHIELD]', 15, 22);"),
    
    # Critical and warning indicators
    (r'????', '[!]'),
    (r'????', ''),
    (r'??????', '[!]'),
    
    # Section headers
    (r'????', ''),
    (r'????', ''),
    
    # Success/Info indicators
    (r'???', '[OK]'),
    (r'??????', '[i]'),
    
    # Action item indicators
    (r'???', '[!]'),
    (r'????', '[LOCK]'),
    (r'????', ''),
    (r'????', '[SCAN]'),
    (r'????', '[FIX]'),
    (r'????', '[DATA]'),
    (r'???????', '[VIEW]'),
    (r'????', '[CHART]'),
    (r'????', '[SYNC]'),
    (r'????', '[NET]'),
    (r'????', '[TARGET]'),
    (r'????', '[TEAM]'),
    (r'????', '[DOC]'),
    
    # Console log emojis (keep these for debugging, they don't go into PDF)
    # But if you want to remove them too:
    # (r'????', '[INFO]'),
    # (r'????', '[START]'),
    # (r'???', '[ERROR]'),
]

# Apply all replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open('reportGenerator.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("??? Emoji replacement complete!")
print("??? File updated successfully")
