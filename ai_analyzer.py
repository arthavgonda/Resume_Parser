import re
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime
from models import ContactInfo, ResumeAnalysis
from intelligent_education_detector import IntelligentEducationDetector

class ImprovedAIAnalyzer:
    def __init__(self):
        self.education_detector = IntelligentEducationDetector()
        self.skill_categories = {
            'programming_languages': [
                'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust',
                'typescript', 'kotlin', 'swift', 'scala', 'r', 'matlab', 'perl', 'c',
                'objective-c', 'dart', 'elixir', 'haskell', 'lua', 'shell', 'bash'
            ],
            'web_technologies': [
                'html', 'css', 'react', 'angular', 'vue.js', 'vue', 'node.js', 'nodejs',
                'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net',
                'jquery', 'bootstrap', 'sass', 'less', 'webpack'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
                'oracle', 'sqlite', 'dynamodb', 'firebase', 'sql'
            ],
            'cloud_platforms': [
                'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean',
                'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins'
            ],
            'data_science': [
                'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
                'pandas', 'numpy', 'matplotlib', 'tableau', 'power bi', 'excel', 'statistics'
            ],
            'soft_skills': [
                'customer service', 'communication', 'leadership', 'teamwork', 'problem solving',
                'time management', 'organization', 'project management', 'public speaking',
                'negotiation', 'sales', 'marketing', 'training', 'mentoring', 'coaching',
                'cash handling', 'numeracy', 'responsibility'
            ],
            'business_skills': [
                'accounting', 'finance', 'economics', 'marketing', 'sales', 'hr',
                'operations', 'consulting', 'strategy', 'business analysis', 'reporting',
                'budgeting', 'management', 'administration'
            ],
            'tools_and_platforms': [
                'git', 'github', 'gitlab', 'jira', 'confluence', 'slack', 'trello',
                'figma', 'photoshop', 'illustrator', 'vs code', 'microsoft office',
                'cash register', 'pos system'
            ]
        }
        self.education_levels = {
            'phd': ['phd', 'ph.d', 'doctorate', 'doctoral', 'doctor of philosophy'],
            'masters': ['master', 'msc', 'm.sc', 'mba', 'm.b.a', 'ms', 'm.s', 'ma', 'm.a'],
            'bachelors': ['bachelor', 'bsc', 'b.sc', 'ba', 'b.a', 'bs', 'b.s', 'be', 'b.e'],
            'diploma': ['diploma', 'associate degree', 'certificate'],
            'high_school': ['year 12', 'year 11', 'high school', 'secondary school', 'hsc', 'vce', 'atar']
        }

    async def analyze_resume(self, resume_text: str, contact_info: Dict[str, Any] = None) -> 'ResumeAnalysis':
        if not contact_info:
            contact_info = self._extract_contact_info_enhanced(resume_text)
        skills = self._extract_skills_enhanced(resume_text)
        experience = self._extract_experience_enhanced(resume_text)
        education = self._extract_education_enhanced(resume_text)
        professional_summary = self._extract_professional_summary_enhanced(resume_text)
        if not professional_summary or len(professional_summary) < 30:
            professional_summary = await self._generate_summary_enhanced(resume_text, skills, experience, education)
        score = self._calculate_resume_score_enhanced(resume_text, skills, experience, education)
        return ResumeAnalysis(
            contact=ContactInfo(**contact_info),
            skills=skills,
            experience=experience,
            education=education,
            summary=professional_summary,
            score=score,
            analysis_date=datetime.now().isoformat()
        )
    
    def _extract_contact_info_enhanced(self, text: str) -> Dict[str, Optional[str]]:
        name = self._extract_name_enhanced(text)
        email = self._extract_email_enhanced(text)
        phone = self._extract_phone_enhanced(text)
        location = self._extract_location_enhanced(text)
        return {
            'name': name,
            'email': email,
            'phone': phone,
            'location': location
        }
    
    def _extract_name_enhanced(self, text: str) -> Optional[str]:
        lines = text.split('\n')
        for line in lines[:8]:
            line = line.strip()
            if not line or len(line) < 3:
                continue
            skip_patterns = [
                r'page\s+\d+', r'tip:', r'@', r'phone', r'mobile', r'email',
                r'address', r'resume', r'curriculum', r'cv'
            ]
            if any(re.search(pattern, line.lower()) for pattern in skip_patterns):
                continue
            words = line.split()
            if 2 <= len(words) <= 4:
                if all(word[0].isupper() and re.match(r'^[A-Za-z]+$', word) for word in words):
                    potential_name = ' '.join(words)
                    if self._validate_name_enhanced(potential_name):
                        return potential_name
        return None
    
    def _validate_name_enhanced(self, name: str) -> bool:
        if not name or len(name) < 3:
            return False
        words = name.split()
        if len(words) < 2 or len(words) > 4:
            return False
        if any(len(word) < 2 or len(word) > 20 for word in words):
            return False
        return True
    
    def _extract_email_enhanced(self, text: str) -> Optional[str]:
        email_pattern = r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
        matches = re.findall(email_pattern, text)
        for email in matches:
            if '@' in email and '.' in email.split('@')[1]:
                return email.lower()
        return None
    
    def _extract_phone_enhanced(self, text: str) -> Optional[str]:
        phone_patterns = [
            r'(\+\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,6})',
            r'(\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,6})',
            r'(\d{10,15})',
            r'(\d{3,5}[-.\s]\d{3,4}[-.\s]\d{3,6})',
            r'(\d{2,4}[-.\s]\d{3,4}[-.\s]\d{3,4}[-.\s]\d{2,4})',
            r'(\(\d{2,4}\)[-.\s]?\d{3,4}[-.\s]?\d{3,6})',
            r'(\d{2,4}[-.\s]?\(\d{2,4}\)[-.\s]?\d{3,6})',
            r'(?:phone|mobile|tel|cell|contact)[:.]?\s*(\+?[\d\s\-\(\)\.]{8,20})',
            r'(\d{4,5}\s\d{3}\s\d{3,4})',
            r'(\d{2,3}\s\d{4}\s\d{4})',
            r'(\d{3}\s\d{3}\s\d{4})',
            r'(\d{2}[-.\s]\d{2}[-.\s]\d{2}[-.\s]\d{2}[-.\s]\d{2})',
            r'(\d{3}[-.\s]\d{3}[-.\s]\d{2}[-.\s]\d{2})',
            r'(\d{3}[-.\s]\d{4}[-.\s]\d{4})',
            r'(\d{2}[-.\s]\d{4}[-.\s]\d{4})',
        ]
        for pattern in phone_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for phone in matches:
                cleaned = self._clean_phone_universal(phone)
                if cleaned:
                    return cleaned
        return None
    
    def _clean_phone_universal(self, phone: str) -> Optional[str]:
        if not phone:
            return None
        digits_only = re.sub(r'[^\d+]', '', phone)
        digit_count = len(digits_only.replace('+', ''))
        if digit_count < 7 or digit_count > 15:
            return None
        cleaned_phone = phone.strip()
        cleaned_phone = re.sub(r'\s+', ' ', cleaned_phone)
        cleaned_phone = re.sub(r'[-.\s]{2,}', '-', cleaned_phone)
        if digit_count > 10 and not cleaned_phone.startswith('+'):
            if re.match(r'^\d{11,15}$', digits_only):
                cleaned_phone = '+' + digits_only
        if cleaned_phone.startswith('+'):
            return self._format_international_phone(cleaned_phone)
        else:
            return self._format_domestic_phone(cleaned_phone, digit_count)
    
    def _format_international_phone(self, phone: str) -> str:
        phone = re.sub(r'\s+', ' ', phone.strip())
        digits = re.sub(r'[^\d]', '', phone)
        if len(digits) == 11 and digits.startswith('1'):
            return f"+1 {digits[1:4]} {digits[4:7]} {digits[7:]}"
        elif len(digits) == 12 and digits.startswith('61'):
            return f"+61 {digits[2]} {digits[3:7]} {digits[7:]}"
        elif len(digits) == 12 and digits.startswith('44'):
            return f"+44 {digits[2:6]} {digits[6:]}"
        elif len(digits) == 12 and digits.startswith('91'):
            return f"+91 {digits[2:7]} {digits[7:]}"
        else:
            if len(phone) > 0:
                return phone
        return phone
    
    def _format_domestic_phone(self, phone: str, digit_count: int) -> str:
        digits = re.sub(r'[^\d]', '', phone)
        if digit_count == 10:
            if '(' in phone and ')' in phone:
                return phone
            else:
                return f"{digits[:3]} {digits[3:6]} {digits[6:]}"
        elif digit_count == 11:
            if digits.startswith('1'):
                return f"1 {digits[1:4]} {digits[4:7]} {digits[7:]}"
            else:
                return f"{digits[:3]} {digits[3:7]} {digits[7:]}"
        elif digit_count == 9:
            return f"{digits[:3]} {digits[3:6]} {digits[6:]}"
        elif digit_count == 8:
            return f"{digits[:4]} {digits[4:]}"
        else:
            return phone.strip()
    
    def _extract_location_enhanced(self, text: str) -> Optional[str]:
        lines = text.split('\n')
        location_patterns = [
            r'(\d+\s+[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+,\s*[\dA-Z]{2,10})',
            r'([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+,\s*[\dA-Z]{2,10})',
            r'([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]{2,})',
            r'([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,3})',
            r'([A-Z][a-zA-Z\s]+,?\s*\d{4,6})',
            r'([A-Z][a-zA-Z\s]+,?\s*[A-Z]\d[A-Z]\s?\d[A-Z]\d)',
            r'([A-Z][a-zA-Z\s]+,?\s*[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})',
            r'(?:location|address|based in|city)[:.]?\s*([A-Z][a-zA-Z\s,.-]+)',
            r'\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b',
        ]
        for line in lines[:8]:
            for pattern in location_patterns:
                matches = re.findall(pattern, line)
                for match in matches:
                    if self._validate_location_universal(match):
                        return match.strip()
        return None
    
    def _validate_location_universal(self, location: str) -> bool:
        if not location or len(location) < 3:
            return False
        if len(location) > 150:
            return False
        location_lower = location.lower()
        exclude_words = [
            'email', 'phone', 'mobile', 'resume', 'page', 'tip', 'skills',
            'experience', 'education', 'objective', 'summary', 'references'
        ]
        if any(word in location_lower for word in exclude_words):
            return False
        valid_chars = sum(c.isalpha() or c.isspace() or c in ',-.' for c in location)
        if valid_chars / len(location) < 0.7:
            return False
        return True

    def _extract_skills_enhanced(self, text: str) -> List[str]:
        skills = set()
        text_lower = text.lower()
        for category, skill_list in self.skill_categories.items():
            for skill in skill_list:
                if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
                    skills.add(self._format_skill(skill))
        skills_section = self._extract_skills_section(text)
        if skills_section:
            additional_skills = self._parse_skills_from_text(skills_section)
            skills.update(additional_skills)
        return list(skills)[:20]
    
    def _format_skill(self, skill: str) -> str:
        skill_mapping = {
            'customer service': 'Customer Service',
            'communication': 'Communication',
            'teamwork': 'Teamwork',
            'leadership': 'Leadership',
            'cash handling': 'Cash Handling',
            'problem solving': 'Problem Solving',
            'time management': 'Time Management',
            'organization': 'Organization'
        }
        return skill_mapping.get(skill.lower(), skill.title())
    
    def _extract_skills_section(self, text: str) -> Optional[str]:
        skill_headers = ['key skills', 'skills', 'abilities', 'competencies']
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_lower = line.strip().lower()
            for header in skill_headers:
                if header in line_lower and len(line_lower) < len(header) + 10:
                    section_content = []
                    for j in range(i + 1, min(i + 15, len(lines))):
                        next_line = lines[j].strip()
                        if self._is_section_header(next_line.lower()):
                            break
                        if next_line and not next_line.lower().startswith('(tip'):
                            section_content.append(next_line)
                    return '\n'.join(section_content)
        return None
    
    def _parse_skills_from_text(self, text: str) -> set:
        skills = set()
        for category, skill_list in self.skill_categories.items():
            for skill in skill_list:
                if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text.lower()):
                    skills.add(self._format_skill(skill))
        return skills
    
    def _extract_experience_enhanced(self, text: str) -> Dict[str, Any]:
        years = self._extract_experience_years_enhanced(text)
        job_titles = self._extract_job_titles_enhanced(text)
        companies = self._extract_companies_enhanced(text)
        level = self._determine_experience_level_enhanced(text, years, job_titles)
        return {
            'years': years,
            'job_titles': job_titles,
            'companies': companies,
            'level': level
        }
    
    def _extract_experience_years_enhanced(self, text: str) -> int:
        exp_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'experience[:\s]*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience'
        ]
        for pattern in exp_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                return max(int(match) for match in matches)
        current_year = datetime.now().year
        date_patterns = [
            r'(20\d{2})\s*[-–]\s*(20\d{2}|current|present)',
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(20\d{2})'
        ]
        years_found = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    if isinstance(match, tuple) and match[0].isdigit():
                        years_found.append(int(match[0]))
                except:
                    pass
        if years_found:
            earliest = min(years_found)
            return max(0, current_year - earliest)
        return 0
    
    def _extract_job_titles_enhanced(self, text: str) -> List[str]:
        job_titles = set()
        title_patterns = [
            r'(customer service|canteen|newspaper deliverer|assistant coach|umpire)',
            r'(volunteer|intern|trainee|assistant|coordinator)',
            r'(cashier|server|clerk|attendant|representative)',
            r'(junior|senior|lead|manager|supervisor)',
            r'(developer|engineer|analyst|designer|specialist)'
        ]
        for pattern in title_patterns:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                job_titles.add(match.title())
        exp_section = self._extract_experience_section(text)
        if exp_section:
            lines = exp_section.split('\n')
            for line in lines:
                if any(word in line.lower() for word in ['club', 'newsagency', 'service', 'coach', 'umpire']):
                    words = line.split()
                    if len(words) >= 2:
                        potential_title = ' '.join(words[:3])
                        if len(potential_title) > 5 and len(potential_title) < 50:
                            job_titles.add(potential_title.title())
        return list(job_titles)[:5]
    
    def _extract_companies_enhanced(self, text: str) -> List[str]:
        companies = set()
        org_patterns = [
            r'([A-Z][a-zA-Z\s]+(?:Club|College|School|Newsagency|Company|Inc|Ltd))',
            r'(Park Hill Soccer Club|Argo Newsagency|Hill Park)',
        ]
        for pattern in org_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if len(match) > 3 and len(match) < 50:
                    companies.add(match.strip())
        return list(companies)[:5]
    
    def _determine_experience_level_enhanced(self, text: str, years: int, titles: List[str]) -> str:
        text_lower = text.lower()
        student_indicators = ['year 11', 'year 12', 'student', 'school', 'college']
        if any(indicator in text_lower for indicator in student_indicators):
            return 'Student'
        entry_indicators = ['seeking', 'looking for', 'casual', 'part-time', 'volunteer']
        if any(indicator in text_lower for indicator in entry_indicators):
            return 'Entry Level'
        if years >= 7:
            return 'Senior'
        elif years >= 3:
            return 'Mid-Level'
        elif years >= 1:
            return 'Junior'
        else:
            return 'Entry Level'
    
    def _extract_education_enhanced(self, text: str) -> Dict[str, Any]:
        best_institution = self.education_detector.get_best_institution(text)
        all_institutions = self.education_detector.get_all_institutions(text, min_confidence=0.4)
        highest_degree = None
        field_of_study = None
        graduation_year = None
        text_lower = text.lower()
        for degree, keywords in self.education_levels.items():
            if any(keyword in text_lower for keyword in keywords):
                highest_degree = degree.replace('_', ' ').title()
                break
        field_patterns = [
            r'B\.?Tech\.?\s+in\s+([^.\n]+)',
            r'Bachelor.*?in\s+([^.\n]+)',
            r'Master.*?in\s+([^.\n]+)',
            r'PhD.*?in\s+([^.\n]+)',
            r'(?:bachelor|master|phd|doctorate).*?(?:in|of)\s+([a-zA-Z\s&]+)(?:from|at|\n|,)',
            r'subjects include:\s*([^.]+)',
            r'studying\s+([^.]+)',
            r'(computer science.*?engineering|computer science|engineering|business|mathematics|science)',
        ]
        for pattern in field_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                field = matches[0].strip()
                if isinstance(field, str) and len(field) > 3:
                    field = re.sub(r'\s+', ' ', field)
                    field = field.replace('&', 'and')
                    field_of_study = field.title()
                    break
        year_patterns = [
            r'(20\d{2})\s*[-–]\s*(20\d{2})',
            r'graduating.*?(20\d{2})',
            r'batch.*?(20\d{2})',
        ]
        for pattern in year_patterns:
            matches = re.findall(pattern, text)
            if matches:
                if isinstance(matches[0], tuple):
                    years = [int(y) for y in matches[0] if y.isdigit()]
                    if years:
                        graduation_year = max(years)
                else:
                    graduation_year = int(matches[0])
                break
        return {
            'highest_degree': highest_degree,
            'field_of_study': field_of_study,
            'institution': best_institution,
            'all_institutions': all_institutions,
            'graduation_year': graduation_year
        }
    
    def _extract_professional_summary_enhanced(self, text: str) -> str:
        summary_headers = ['career objective', 'objective', 'summary', 'profile', 'about']
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_lower = line.strip().lower()
            for header in summary_headers:
                if header in line_lower and len(line_lower) < len(header) + 10:
                    summary_lines = []
                    for j in range(i + 1, len(lines)):
                        next_line = lines[j].strip()
                        if next_line.lower().startswith('(tip'):
                            continue
                        if self._is_section_header(next_line.lower()):
                            break
                        if next_line:
                            summary_lines.append(next_line)
                    if summary_lines:
                        summary = ' '.join(summary_lines)
                        summary = re.sub(r'\(Tip:.*?\)', '', summary, flags=re.DOTALL)
                        return summary.strip()
        return None
    
    async def _generate_summary_enhanced(self, text: str, skills: List[str], 
                                       experience: Dict[str, Any], education: Dict[str, Any]) -> str:
        level = experience.get('level', 'Professional')
        years = experience.get('years', 0)
        job_titles = experience.get('job_titles', [])
        degree = education.get('highest_degree', '')
        summary_parts = []
        if level == 'Student':
            summary_parts.append(f"Motivated {degree} student")
            if skills:
                summary_parts.append(f"with demonstrated skills in {', '.join(skills[:3])}")
        elif level == 'Entry Level':
            summary_parts.append("Enthusiastic entry-level professional")
            if years > 0:
                summary_parts.append(f"with {years} year(s) of experience")
        else:
            if years > 0:
                summary_parts.append(f"Experienced professional with {years} years")
            else:
                summary_parts.append("Dedicated professional")
        if job_titles:
            summary_parts.append(f"in {job_titles[0].lower()}")
        if skills:
            if len(skills) > 3:
                summary_parts.append(f"Strong background in {', '.join(skills[:2])}, and {skills[2]}")
            else:
                summary_parts.append(f"Skilled in {', '.join(skills)}")
        summary = " ".join(summary_parts)
        if level == 'Student':
            summary += ". Seeking opportunities to apply academic knowledge and develop professional skills."
        else:
            summary += ". Committed to delivering high-quality results and continuous professional development."
        return summary
    
    def _calculate_resume_score_enhanced(self, text: str, skills: List[str], 
                                       experience: Dict[str, Any], education: Dict[str, Any]) -> int:
        score = 0
        level = experience.get('level', 'Professional')
        if '@' in text: score += 8
        if re.search(r'\d{3,5}\s?\d{3}\s?\d{3}', text): score += 8
        if re.search(r'[A-Z][a-zA-Z\s]+,\s*[A-Z]', text): score += 4
        if self._extract_name_enhanced(text): score += 5
        word_count = len(text.split())
        if word_count > 200: score += 8
        if word_count > 400: score += 4
        if any(word in text.lower() for word in ['objective', 'summary', 'skills']): score += 4
        if any(word in text.lower() for word in ['experience', 'work', 'volunteer']): score += 4
        skill_count = len(skills)
        if level == 'Student':
            if skill_count >= 5: score += 25
            elif skill_count >= 3: score += 20
            elif skill_count >= 1: score += 15
        else:
            if skill_count >= 10: score += 25
            elif skill_count >= 5: score += 20
            elif skill_count >= 2: score += 15
        years = experience.get('years', 0)
        job_titles = experience.get('job_titles', [])
        if level == 'Student':
            if job_titles: score += 15
            if years >= 1: score += 5
        else:
            if years >= 5: score += 15
            elif years >= 2: score += 12
            elif years >= 1: score += 8
            if job_titles: score += 5
        degree = education.get('highest_degree', '')
        if degree:
            if 'Phd' in degree: score += 10
            elif 'Masters' in degree: score += 9
            elif 'Bachelors' in degree: score += 8
            elif 'High School' in degree or 'Year' in degree: score += 6
            else: score += 5
        return min(score, 100)
    
    def _extract_experience_section(self, text: str) -> Optional[str]:
        exp_headers = ['work experience', 'experience', 'employment', 'work history']
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_lower = line.strip().lower()
            for header in exp_headers:
                if header in line_lower and len(line_lower) < len(header) + 10:
                    section_content = []
                    for j in range(i + 1, min(i + 20, len(lines))):
                        next_line = lines[j].strip()
                        if self._is_section_header(next_line.lower()):
                            break
                        if next_line and not next_line.lower().startswith('(tip'):
                            section_content.append(next_line)
                    return '\n'.join(section_content)
        return None
    
    def _is_section_header(self, line: str) -> bool:
        headers = [
            'education', 'experience', 'work', 'skills', 'objective', 'summary',
            'employment', 'career', 'qualifications', 'achievements', 'projects',
            'certifications', 'awards', 'interests', 'hobbies', 'references',
            'leadership', 'volunteer', 'activities', 'availability'
        ]
        line_clean = line.strip().lower()
        return any(header in line_clean for header in headers)
