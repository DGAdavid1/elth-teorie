#!/usr/bin/env python3
"""
Parser for Moodle exam PDF text extracted from pdftotext.
"""

import re
import json
import sys
from collections import defaultdict

CORRECT_MARK = ''  # EF 80 8C
WRONG_MARK   = ''  # EF 80 8D

def clean(s):
    s = s.replace(CORRECT_MARK, '').replace(WRONG_MARK, '')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def has_correct(line):
    return CORRECT_MARK in line

def has_wrong(line):
    return WRONG_MARK in line

def split_two_columns(line):
    """Split 'left   [spaces 4+]   right' into (left, right). Returns None if no gap."""
    raw = line.replace(CORRECT_MARK, '').replace(WRONG_MARK, '')
    # Find a gap of 4+ spaces between non-space content
    m = re.search(r'(\S.*?\S)\s{4,}(\S.*)', raw)
    if m:
        return clean(m.group(1)), clean(m.group(2))
    return None


def parse_file(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        raw = f.read()

    # Remove page breaks and URL noise
    raw = re.sub(r'\f', '\n', raw)
    raw = re.sub(r'https?://\S+', '', raw)
    raw = re.sub(r'^\d+[./]\d+[./]\d+\s+FINAL.*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'Dashboard.*', '', raw, flags=re.MULTILINE)

    lines = raw.split('\n')

    # Find all "Question N" line indices
    q_starts = []
    for i, line in enumerate(lines):
        if re.match(r'^\s*Question\s+\d+\s*$', line):
            q_starts.append(i)

    print(f"Found {len(q_starts)} question occurrences", file=sys.stderr)

    questions_by_text = {}

    for idx, start in enumerate(q_starts):
        end = q_starts[idx + 1] if idx + 1 < len(q_starts) else len(lines)
        block = lines[start:end]
        q = parse_block(block)
        if q is None:
            continue

        key = q['_key']
        existing = questions_by_text.get(key)
        if existing is None:
            questions_by_text[key] = q
        elif q['status'] == 'Correct' and existing['status'] != 'Correct':
            questions_by_text[key] = q

    result = list(questions_by_text.values())

    # Post-process: clean and filter
    result = [q for q in result if is_valid_question(q)]
    for q in result:
        if q['type'] in ('single', 'multiple'):
            q['options'] = [o for o in q['options'] if is_valid_option(o['text'])]
        clean_question_text(q)

    # Re-filter after option cleanup
    result = [q for q in result if is_valid_question(q)]

    for i, q in enumerate(result):
        q['id'] = i + 1
        del q['_key']

    print(f"Unique questions: {len(result)}", file=sys.stderr)
    by_type = defaultdict(int)
    by_status = defaultdict(int)
    for q in result:
        by_type[q['type']] += 1
        by_status[q['status']] += 1
    print(f"Types: {dict(by_type)}", file=sys.stderr)
    print(f"Statuses: {dict(by_status)}", file=sys.stderr)
    return result


JUNK_PATTERNS = [
    r'Flag question',
    r'^\d+/\d+$',  # page number like "2/15"
    r'^Mark \d+\.\d+ out',
    r'^Question \d+',
    r'Jump to\.\.\.',
    r'UPB-Elearning',
    r'^1\.00$',
]

def is_junk(text):
    for pat in JUNK_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            return True
    return False

def is_valid_option(text):
    if not text or len(text) < 2:
        return False
    if is_junk(text):
        return False
    return True

def clean_question_text(q):
    # Clean the question text of junk
    text = q['text']
    # Remove "of 1.00" artifacts from Mark line
    text = re.sub(r'\bof \d+\.\d+\b', '', text).strip()
    q['text'] = text

def is_valid_question(q):
    text = q.get('text', '')
    if not text or len(text) < 5:
        return False
    if is_junk(text):
        return False
    # For single/multiple: must have at least 2 valid options with >=1 correct
    if q['type'] in ('single', 'multiple'):
        opts = [o for o in q.get('options', []) if is_valid_option(o['text'])]
        if len(opts) < 2:
            return False
        correct = [o for o in opts if o['correct']]
        if not correct and q['status'] == 'Correct':
            return False
    return True


def parse_block(block):
    if not block:
        return None

    # Extract status
    status = None
    content_start = 0
    for i, line in enumerate(block[:10]):
        s = line.strip()
        if s in ('Correct', 'Incorrect', 'Partially correct'):
            status = s
        if s.startswith('Mark ') and 'out of' in s:
            content_start = i + 1
            break

    if status is None or content_start == 0:
        return None

    content = block[content_start:]

    # Determine question type
    has_select_one = any(re.search(r'Select one\s*:', l) for l in content)
    has_select_multi = any(re.search(r'Select one or more\s*:|Select all', l) for l in content)
    has_answer_line = any(l.strip().startswith('Answer:') for l in content)

    if has_select_one:
        q_type = 'single'
    elif has_select_multi:
        q_type = 'multiple'
    elif has_answer_line:
        q_type = 'fillin'
    else:
        q_type = detect_nonstandard(content)

    # Extract question text (first non-empty text before options/answers)
    q_text = get_question_text(content, q_type)
    if not q_text or len(q_text) < 3:
        return None

    key = re.sub(r'\s+', ' ', q_text.lower()[:80])

    q = {
        '_key': key,
        'status': status,
        'type': q_type,
        'text': q_text,
    }

    if q_type in ('single', 'multiple'):
        opts = parse_options(content)
        if not opts or len(opts) < 2:
            return None
        q['options'] = opts

    elif q_type == 'fillin':
        ans = parse_fillin(content)
        if ans is None:
            return None
        q['answer'] = ans

    elif q_type == 'matching':
        pairs = parse_matching(content)
        if not pairs:
            return None
        q['pairs'] = pairs

    elif q_type == 'textblanks':
        filled = parse_textblanks(content)
        q['filledText'] = filled

    return q


def detect_nonstandard(lines):
    """Decide between 'matching' and 'textblanks'.

    Key insight from PDF extraction:
    - textblanks: CORRECT_MARK appears in the MIDDLE of a line (followed by more text)
    - matching:   CORRECT_MARK appears at the END of a line (only trailing spaces after it)
    """
    correct_lines = [l for l in lines if has_correct(l) and l.strip()]

    textblanks_votes = 0
    matching_votes = 0

    for l in correct_lines:
        # Find the position of CORRECT_MARK in the line
        pos = l.find(CORRECT_MARK)
        after = l[pos + len(CORRECT_MARK):]
        after_stripped = after.strip()

        if after_stripped:
            # There's text after the mark → inline fill = textblanks
            textblanks_votes += 1
        else:
            # Mark is at end of line → could be matching or option
            pair = split_two_columns(l)
            if pair and pair[0] and pair[1]:
                matching_votes += 1
            else:
                # Single-column line ending with mark
                textblanks_votes += 1

    if textblanks_votes > matching_votes:
        return 'textblanks'
    if matching_votes > 0:
        return 'matching'
    return 'textblanks'


def get_question_text(lines, q_type):
    """Extract question text before options/answers start."""
    result = []
    for line in lines:
        stripped = line.strip()
        if re.search(r'Select one', line):
            break
        if stripped.startswith('Answer:'):
            break
        # For matching, stop at first two-column line
        if q_type == 'matching':
            pair = split_two_columns(line)
            if pair and result:
                break
        # For textblanks, the question text might be the first meaningful line
        if stripped and not stripped.startswith('Mark '):
            clean_stripped = clean(stripped)
            if clean_stripped:
                result.append(clean_stripped)
        elif result and not stripped:
            # Blank line after content - for textblanks, keep going; for others, might stop
            if q_type in ('single', 'multiple', 'fillin'):
                continue

    return ' '.join(result[:3]) if result else ''


def parse_options(lines):
    """Parse multiple/single choice options."""
    # Find Select line
    sel_idx = None
    for i, line in enumerate(lines):
        if re.search(r'Select one', line):
            sel_idx = i
            break
    if sel_idx is None:
        return None

    option_lines = lines[sel_idx + 1:]
    options = []
    current = []
    curr_correct = False
    curr_wrong = False

    def flush():
        if current:
            txt = clean(' '.join(current))
            if txt and len(txt) > 1:
                options.append({
                    'text': txt,
                    'correct': curr_correct,
                })

    for line in option_lines:
        raw = line.rstrip('\n')
        stripped = raw.strip()

        if not stripped:
            flush()
            current = []
            curr_correct = False
            curr_wrong = False
            continue

        c = has_correct(raw)
        w = has_wrong(raw)
        if c:
            curr_correct = True
        if w:
            curr_wrong = True

        txt = clean(stripped)
        if txt:
            current.append(txt)

    flush()

    # Remove duplicates while preserving order
    seen = set()
    unique = []
    for o in options:
        k = o['text'][:50]
        if k not in seen:
            seen.add(k)
            unique.append(o)

    return unique if len(unique) >= 2 else None


def parse_fillin(lines):
    for line in lines:
        s = line.strip()
        if s.startswith('Answer:'):
            val = re.sub(r'^Answer\s*:', '', s).strip()
            return clean(val)
    return None


def parse_matching(lines):
    """
    Parse matching pairs from content lines.
    Two formats:
      A) 'left text   [spaces]   right text ✓'  (pair on single line)
      B) 'left text' + 'right text ✓' on consecutive lines (handled by merging)
    """
    pairs = []
    seen = set()

    # Scan lines for ones with CORRECT_MARK and two-column structure
    non_empty = [(i, l) for i, l in enumerate(lines) if l.strip() or has_correct(l)]

    i = 0
    while i < len(non_empty):
        idx, line = non_empty[i]

        if has_correct(line):
            pair = split_two_columns(line)
            if pair and pair[0] and pair[1] and len(pair[1]) > 0:
                left, right = pair
                k = (left[:30], right[:30])
                if k not in seen:
                    seen.add(k)
                    pairs.append({'left': left, 'right': right})
            else:
                # CORRECT mark is alone or at end of single-column line
                # The right side might be on this line, left on previous
                right_text = clean(line)
                if right_text:
                    # Find previous non-empty line
                    prev_text = ''
                    for j in range(i - 1, -1, -1):
                        pt = clean(non_empty[j][1])
                        if pt and not has_correct(non_empty[j][1]):
                            prev_text = pt
                            break
                    if prev_text and right_text and prev_text != right_text:
                        k = (prev_text[:30], right_text[:30])
                        if k not in seen:
                            seen.add(k)
                            pairs.append({'left': prev_text, 'right': right_text})
        i += 1

    return pairs if pairs else None


def parse_textblanks(lines):
    """Return the text with blanks filled in, marking correct words."""
    parts = []
    for line in lines:
        stripped = line.strip()
        if stripped:
            # Replace CORRECT_MARK with a visible marker
            txt = line.replace(CORRECT_MARK, '[✓]').replace(WRONG_MARK, '[✗]')
            parts.append(clean(txt))
    return ' '.join(parts)


if __name__ == '__main__':
    path = './exam-source/exam_text.txt'
    qs = parse_file(path)
    print(json.dumps(qs, ensure_ascii=False, indent=2))
