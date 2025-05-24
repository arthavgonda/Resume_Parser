import re
from typing import List, Dict, Any, Optional, Tuple
import unicodedata

class IntelligentEducationDetector:
    def __init__(self):
        self.institution_suffixes = {
            'university': ['university', 'univ', 'università', 'université', 'universidad', 'universität', 'universidade', 'università', 'uniwersytet'],
            'college': ['college', 'coll', 'college', 'коледж', 'colegio', 'collège'],
            'institute': ['institute', 'institut', 'instituto', 'istituto', 'instytut'],
            'school': ['school', 'école', 'escuela', 'scuola', 'schule', 'szkola'],
            'academy': ['academy', 'académie', 'academia', 'accademia', 'akademie'],
            'polytechnic': ['polytechnic', 'poly', 'politécnico', 'politecnico'],
            'technology': ['technology', 'tech', 'tecnología', 'technologie', 'tecnologia']
        }
        self.institution_prefixes = [
            'iit', 'mit', 'stanford', 'harvard', 'oxford', 'cambridge',
            'university of', 'college of', 'institute of', 'school of',
            'national', 'international', 'indian', 'american', 'british',
            'royal', 'imperial', 'federal', 'state', 'public', 'private'
        ]
        self.degree_patterns = [
            r'\b(b\.?tech\.?|bachelor.*?technology|btech)\b',
            r'\b(b\.?e\.?|bachelor.*?engineering|be)\b',
            r'\b(b\.?sc\.?|bachelor.*?science|bsc)\b',
            r'\b(b\.?a\.?|bachelor.*?arts|ba)\b',
            r'\b(b\.?com\.?|bachelor.*?commerce|bcom)\b',
            r'\b(m\.?tech\.?|master.*?technology|mtech)\b',
            r'\b(m\.?sc\.?|master.*?science|msc)\b',
            r'\b(m\.?a\.?|master.*?arts|ma)\b',
            r'\b(mba|master.*?business)\b',
            r'\b(phd|ph\.?d\.?|doctorate)\b',
            r'\b(diploma|certificate)\b'
        ]
        self.education_context_words = [
            'graduated', 'degree', 'major', 'minor', 'gpa', 'cgpa', 'grade',
            'semester', 'year', 'batch', 'class', 'alumni', 'student',
            'education', 'academic', 'study', 'studied', 'pursuing'
        ]
        self.exclude_words = [
            'company', 'corporation', 'corp', 'inc', 'ltd', 'llc',
            'hospital', 'clinic', 'bank', 'shop', 'store', 'restaurant',
            'hotel', 'club', 'gym', 'sports', 'football', 'soccer', 'cricket'
        ]

    def detect_institutions(self, text: str) -> List[Dict[str, Any]]:
        institutions = []
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_institutions = self._detect_in_line(line, i, lines)
            institutions.extend(line_institutions)
        unique_institutions = self._remove_duplicates(institutions)
        return sorted(unique_institutions, key=lambda x: x['confidence'], reverse=True)
    
    def _detect_in_line(self, line: str, line_index: int, all_lines: List[str]) -> List[Dict[str, Any]]:
        institutions = []
        line_clean = self._clean_text(line)
        if len(line_clean) < 3:
            return institutions
        explicit_institutions = self._find_explicit_institutions(line_clean)
        degree_context_institutions = self._find_degree_context_institutions(line_clean)
        context_institutions = self._find_context_institutions(line_clean, line_index, all_lines)
        all_detected = explicit_institutions + degree_context_institutions + context_institutions
        for inst in all_detected:
            confidence = self._calculate_confidence(inst, line_clean, line_index, all_lines)
            if confidence > 0.3:
                institutions.append({
                    'name': inst,
                    'confidence': confidence,
                    'line': line.strip(),
                    'context': self._get_context(line_index, all_lines)
                })
        return institutions
    
    def _find_explicit_institutions(self, text: str) -> List[str]:
        institutions = []
        all_suffixes = []
        for suffix_list in self.institution_suffixes.values():
            all_suffixes.extend(suffix_list)
        pattern = r'\b([A-Z][a-zA-Z\s&\-\.]+(?:' + '|'.join(re.escape(suffix) for suffix in all_suffixes) + r'))\b'
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if self._is_valid_institution_name(match):
                institutions.append(match.strip())
        return institutions
    
    def _find_degree_context_institutions(self, text: str) -> List[str]:
        institutions = []
        for degree_pattern in self.degree_patterns:
            pattern = degree_pattern + r'.*?(?:from|at|@)\s+([A-Z][a-zA-Z\s&\-\.]+)'
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match) > 3 and self._is_valid_institution_name(match):
                    institutions.append(match.strip())
        return institutions
    
    def _find_context_institutions(self, text: str, line_index: int, all_lines: List[str]) -> List[str]:
        institutions = []
        context_score = self._calculate_education_context(text, line_index, all_lines)
        if context_score > 0.5:
            proper_nouns = self._extract_proper_nouns(text)
            for noun in proper_nouns:
                if (len(noun) > 5 and 
                    len(noun.split()) >= 2 and 
                    self._is_valid_institution_name(noun)):
                    institutions.append(noun)
        return institutions
    
    def _calculate_confidence(self, institution: str, line: str, line_index: int, all_lines: List[str]) -> float:
        confidence = 0.0
        institution_lower = institution.lower()
        line_lower = line.lower()
        for suffix_list in self.institution_suffixes.values():
            if any(suffix in institution_lower for suffix in suffix_list):
                confidence += 0.4
                break
        if any(prefix in institution_lower for prefix in self.institution_prefixes):
            confidence += 0.2
        context_words_found = sum(1 for word in self.education_context_words if word in line_lower)
        confidence += min(context_words_found * 0.1, 0.3)
        context_lines = self._get_nearby_lines(line_index, all_lines, 2)
        for context_line in context_lines:
            for degree_pattern in self.degree_patterns:
                if re.search(degree_pattern, context_line, re.IGNORECASE):
                    confidence += 0.15
                    break
        if any(exclude_word in institution_lower for exclude_word in self.exclude_words):
            confidence -= 0.5
        words = institution.split()
        if len(words) >= 2 and all(word[0].isupper() for word in words if len(word) > 2):
            confidence += 0.1
        if 10 <= len(institution) <= 80:
            confidence += 0.1
        return min(confidence, 1.0)
    
    def _calculate_education_context(self, text: str, line_index: int, all_lines: List[str]) -> float:
        context_score = 0.0
        text_lower = text.lower()
        context_words_found = sum(1 for word in self.education_context_words if word in text_lower)
        context_score += context_words_found * 0.2
        nearby_lines = self._get_nearby_lines(line_index, all_lines, 3)
        for line in nearby_lines:
            line_lower = line.lower()
            context_words_found = sum(1 for word in self.education_context_words if word in line_lower)
            context_score += context_words_found * 0.1
            for degree_pattern in self.degree_patterns:
                if re.search(degree_pattern, line_lower):
                    context_score += 0.3
                    break
        return min(context_score, 1.0)
    
    def _extract_proper_nouns(self, text: str) -> List[str]:
        proper_nouns = []
        pattern = r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})\b'
        matches = re.findall(pattern, text)
        for match in matches:
            if len(match) > 5 and len(match) < 100:
                proper_nouns.append(match)
        return proper_nouns
    
    def _is_valid_institution_name(self, name: str) -> bool:
        if not name or len(name) < 3:
            return False
        name_lower = name.lower().strip()
        if any(exclude_word in name_lower for exclude_word in self.exclude_words):
            return False
        if len(name) < 5 or len(name) > 150:
            return False
        letter_ratio = sum(c.isalpha() or c.isspace() for c in name) / len(name)
        if letter_ratio < 0.7:
            return False
        common_non_institutions = [
            'resume', 'curriculum', 'experience', 'skills', 'projects',
            'contact', 'phone', 'email', 'address', 'objective'
        ]
        if any(word in name_lower for word in common_non_institutions):
            return False
        return True
    
    def _get_nearby_lines(self, line_index: int, all_lines: List[str], radius: int) -> List[str]:
        start = max(0, line_index - radius)
        end = min(len(all_lines), line_index + radius + 1)
        return all_lines[start:end]
    
    def _get_context(self, line_index: int, all_lines: List[str]) -> str:
        nearby_lines = self._get_nearby_lines(line_index, all_lines, 2)
        return ' '.join(line.strip() for line in nearby_lines if line.strip())
    
    def _clean_text(self, text: str) -> str:
        text = unicodedata.normalize('NFKD', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def _remove_duplicates(self, institutions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen = set()
        unique = []
        for inst in institutions:
            name_normalized = inst['name'].lower().strip()
            if name_normalized not in seen:
                seen.add(name_normalized)
                unique.append(inst)
        return unique
    
    def get_best_institution(self, text: str) -> Optional[str]:
        institutions = self.detect_institutions(text)
        if institutions:
            return institutions[0]['name']
        return None
    
    def get_all_institutions(self, text: str, min_confidence: float = 0.5) -> List[str]:
        institutions = self.detect_institutions(text)
        return [inst['name'] for inst in institutions if inst['confidence'] >= min_confidence]
    
    def detect_with_details(self, text: str) -> Dict[str, Any]:
        institutions = self.detect_institutions(text)
        return {
            'institutions': institutions,
            'best_match': institutions[0]['name'] if institutions else None,
            'total_found': len(institutions),
            'high_confidence': [inst for inst in institutions if inst['confidence'] > 0.7],
            'medium_confidence': [inst for inst in institutions if 0.4 <= inst['confidence'] <= 0.7],
            'analysis': {
                'has_degree_context': self._has_degree_context(text),
                'education_context_strength': self._calculate_overall_education_context(text),
                'proper_nouns_found': len(self._extract_proper_nouns(text))
            }
        }
    
    def _has_degree_context(self, text: str) -> bool:
        for pattern in self.degree_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _calculate_overall_education_context(self, text: str) -> float:
        text_lower = text.lower()
        context_words_found = sum(1 for word in self.education_context_words if word in text_lower)
        return min(context_words_found / len(self.education_context_words), 1.0)
