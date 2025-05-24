from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime

class ContactInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            return None
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and len(v.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) < 10:
            return None
        return v

class ExperienceInfo(BaseModel):
    years: int = Field(default=0, ge=0, le=50)
    job_titles: List[str] = Field(default_factory=list)
    companies: List[str] = Field(default_factory=list)
    level: str = Field(default="Junior")
    
    @validator('level')
    def validate_level(cls, v):
        valid_levels = ['Junior', 'Mid-Level', 'Senior']
        if v not in valid_levels:
            return 'Junior'
        return v

class EducationInfo(BaseModel):
    highest_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[int] = None
    
    @validator('graduation_year')
    def validate_graduation_year(cls, v):
        if v and (v < 1950 or v > datetime.now().year + 5):
            return None
        return v

class ResumeAnalysis(BaseModel):
    contact: ContactInfo
    skills: List[str] = Field(default_factory=list)
    experience: Dict[str, Any] = Field(default_factory=dict)
    education: Dict[str, Any] = Field(default_factory=dict)
    summary: str = Field(default="")
    score: int = Field(default=0, ge=0, le=100)
    analysis_date: str
    experience_info: Optional[ExperienceInfo] = None
    education_info: Optional[EducationInfo] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "contact": {
                    "name": "John Smith",
                    "email": "john.smith@email.com",
                    "phone": "+1 (555) 123-4567",
                    "location": "San Francisco, CA"
                },
                "skills": ["JavaScript", "React", "Node.js", "Python", "AWS"],
                "experience": {
                    "years": 5,
                    "job_titles": ["Senior Full Stack Developer"],
                    "companies": ["TechCorp Inc."],
                    "level": "Senior"
                },
                "education": {
                    "highest_degree": "Bachelors",
                    "field_of_study": "Computer Science",
                    "institution": "University of Technology",
                    "graduation_year": 2018
                },
                "summary": "Experienced full-stack developer with 5+ years of expertise in modern web technologies...",
                "score": 85,
                "analysis_date": "2025-05-23T10:30:00"
            }
        }

class JobMatch(BaseModel):
    job_id: int
    title: str
    company: str
    location: str
    salary_range: str
    required_skills: List[str]
    experience_required: str
    match_percentage: int = Field(ge=0, le=100)
    description: str
    job_type: str = Field(default="Full-time")
    remote: bool = Field(default=False)
    posted_date: str
    skills_matched: List[str] = Field(default_factory=list)
    skills_missing: List[str] = Field(default_factory=list)
    experience_match: bool = Field(default=False)
    
    @validator('match_percentage')
    def validate_match_percentage(cls, v):
        return max(0, min(100, v))
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": 1,
                "title": "Senior Full Stack Developer",
                "company": "TechCorp Inc.",
                "location": "San Francisco, CA",
                "salary_range": "$120k - $150k",
                "required_skills": ["React", "Node.js", "JavaScript", "Python", "AWS"],
                "experience_required": "5+ years",
                "match_percentage": 92,
                "description": "We're looking for a senior full stack developer...",
                "job_type": "Full-time",
                "remote": True,
                "posted_date": "2025-05-21T09:00:00",
                "skills_matched": ["React", "Node.js", "JavaScript", "Python"],
                "skills_missing": ["AWS"],
                "experience_match": True
            }
        }

class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=50, max_length=50000)
    
    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Text cannot be empty')
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "John Smith\njohn.smith@email.com\n+1 (555) 123-4567\nSan Francisco, CA\n\nProfessional Summary\nExperienced full-stack developer with 5+ years of expertise..."
            }
        }

class JobSearchRequest(BaseModel):
    skills: Optional[List[str]] = Field(default_factory=list)
    experience_years: Optional[int] = Field(default=None, ge=0, le=50)
    location: Optional[str] = None
    job_type: Optional[str] = None
    remote_only: Optional[bool] = False
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)
    
    @validator('salary_max')
    def validate_salary_range(cls, v, values):
        if v and 'salary_min' in values and values['salary_min']:
            if v < values['salary_min']:
                raise ValueError('Maximum salary must be greater than minimum salary')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "skills": ["React", "JavaScript", "Node.js"],
                "experience_years": 3,
                "location": "San Francisco",
                "job_type": "Full-time",
                "remote_only": False,
                "salary_min": 80000,
                "salary_max": 120000
            }
        }

class APIResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Resume analyzed successfully",
                "data": {"analysis": "...", "job_matches": "..."},
                "error": None,
                "timestamp": "2025-05-23T10:30:00"
            }
        }

class SkillCategory(BaseModel):
    category: str
    skills: List[str]
    count: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "category": "Programming Languages",
                "skills": ["Python", "JavaScript", "Java", "C++"],
                "count": 4
            }
        }

class ResumeScore(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    breakdown: Dict[str, int] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "overall_score": 85,
                "breakdown": {
                    "contact_info": 20,
                    "skills": 25,
                    "experience": 18,
                    "education": 10,
                    "presentation": 12
                },
                "recommendations": [
                    "Add more technical skills to increase your score",
                    "Include a professional summary section",
                    "Add quantifiable achievements in your experience"
                ]
            }
        }
