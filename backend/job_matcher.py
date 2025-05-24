import asyncio
from typing import List, Dict, Any, Optional
import random
from datetime import datetime, timedelta
from models import JobMatch, ResumeAnalysis

class EnhancedJobMatcher:
    def __init__(self):
        self.job_database = [
            {
                "id": 1,
                "title": "Senior Full Stack Developer",
                "company": "TechCorp Inc.",
                "location": "San Francisco, CA",
                "salary_min": 120000,
                "salary_max": 150000,
                "required_skills": ["React", "Node.js", "JavaScript", "Python", "AWS", "Docker"],
                "preferred_skills": ["TypeScript", "Kubernetes", "PostgreSQL"],
                "experience_years": 5,
                "job_type": "Full-time",
                "remote": True,
                "description": "We're looking for a senior full stack developer to join our growing team. You'll work on cutting-edge web applications and lead technical initiatives.",
                "posted_date": datetime.now() - timedelta(days=2),
                "benefits": ["Health Insurance", "401k", "Flexible Hours", "Remote Work"],
                "team_size": "10-20 people"
            },
            {
                "id": 2,
                "title": "Frontend Developer",
                "company": "StartupXYZ",
                "location": "Austin, TX",
                "salary_min": 80000,
                "salary_max": 110000,
                "required_skills": ["React", "JavaScript", "CSS", "HTML", "TypeScript"],
                "preferred_skills": ["Redux", "Sass", "Webpack"],
                "experience_years": 3,
                "job_type": "Full-time",
                "remote": False,
                "description": "Join our dynamic team to create amazing user experiences. Work with modern frontend technologies in an agile environment.",
                "posted_date": datetime.now() - timedelta(days=1),
                "benefits": ["Health Insurance", "Stock Options", "Learning Budget"],
                "team_size": "5-10 people"
            },
            {
                "id": 3,
                "title": "Backend Engineer",
                "company": "CloudTech Solutions",
                "location": "Seattle, WA",
                "salary_min": 100000,
                "salary_max": 130000,
                "required_skills": ["Python", "Django", "PostgreSQL", "Docker", "Kubernetes"],
                "preferred_skills": ["Redis", "Elasticsearch", "Terraform"],
                "experience_years": 4,
                "job_type": "Full-time",
                "remote": True,
                "description": "Build scalable backend systems for our cloud platform. Work with cutting-edge technologies and microservices architecture.",
                "posted_date": datetime.now() - timedelta(days=3),
                "benefits": ["Health Insurance", "401k", "Unlimited PTO"],
                "team_size": "15-25 people"
            },
            {
                "id": 4,
                "title": "Data Scientist",
                "company": "AI Innovations",
                "location": "Boston, MA",
                "salary_min": 130000,
                "salary_max": 160000,
                "required_skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Pandas"],
                "preferred_skills": ["PyTorch", "Jupyter", "AWS", "Statistics"],
                "experience_years": 3,
                "job_type": "Full-time",
                "remote": True,
                "description": "Apply machine learning and statistical analysis to solve complex business problems. Work with large datasets and build predictive models.",
                "posted_date": datetime.now() - timedelta(days=4),
                "benefits": ["Health Insurance", "Research Budget", "Conference Attendance"],
                "team_size": "8-12 people"
            },
            {
                "id": 5,
                "title": "DevOps Engineer",
                "company": "Infrastructure Pro",
                "location": "Denver, CO",
                "salary_min": 110000,
                "salary_max": 140000,
                "required_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Python"],
                "preferred_skills": ["Ansible", "Jenkins", "Monitoring"],
                "experience_years": 4,
                "job_type": "Full-time",
                "remote": True,
                "description": "Manage and optimize our cloud infrastructure. Implement CI/CD pipelines and ensure system reliability and scalability.",
                "posted_date": datetime.now() - timedelta(days=5),
                "benefits": ["Health Insurance", "401k", "Home Office Setup"],
                "team_size": "6-10 people"
            },
            {
                "id": 6,
                "title": "Mobile Developer",
                "company": "AppCraft Studios",
                "location": "Los Angeles, CA",
                "salary_min": 95000,
                "salary_max": 125000,
                "required_skills": ["React Native", "JavaScript", "iOS", "Android"],
                "preferred_skills": ["Flutter", "Swift", "Kotlin"],
                "experience_years": 3,
                "job_type": "Full-time",
                "remote": False,
                "description": "Develop cross-platform mobile applications for millions of users. Work with cutting-edge mobile technologies.",
                "posted_date": datetime.now() - timedelta(days=6),
                "benefits": ["Health Insurance", "Gym Membership", "Catered Meals"],
                "team_size": "12-18 people"
            },
            {
                "id": 7,
                "title": "Junior Software Developer",
                "company": "TechStart Inc.",
                "location": "Chicago, IL",
                "salary_min": 65000,
                "salary_max": 85000,
                "required_skills": ["JavaScript", "HTML", "CSS", "Git"],
                "preferred_skills": ["React", "Node.js", "SQL"],
                "experience_years": 1,
                "job_type": "Full-time",
                "remote": True,
                "description": "Great opportunity for junior developers to grow their skills. Mentorship program and learning opportunities available.",
                "posted_date": datetime.now() - timedelta(days=7),
                "benefits": ["Health Insurance", "Mentorship Program", "Learning Budget"],
                "team_size": "20-30 people"
            },
            {
                "id": 8,
                "title": "UI/UX Designer",
                "company": "DesignForward",
                "location": "New York, NY",
                "salary_min": 85000,
                "salary_max": 115000,
                "required_skills": ["Figma", "Adobe XD", "Sketch", "Prototyping"],
                "preferred_skills": ["User Research", "Wireframing", "HTML", "CSS"],
                "experience_years": 3,
                "job_type": "Full-time",
                "remote": True,
                "description": "Design beautiful and intuitive user interfaces. Collaborate with product and engineering teams.",
                "posted_date": datetime.now() - timedelta(days=8),
                "benefits": ["Health Insurance", "Design Tools Budget", "Flexible Schedule"],
                "team_size": "8-15 people"
            }
        ]
    
    async def find_matches(self, resume_analysis: ResumeAnalysis) -> List[JobMatch]:
        matches = []
        user_skills = [skill.lower() for skill in resume_analysis.skills]
        user_experience = resume_analysis.experience.get('years', 0)
        user_level = resume_analysis.experience.get('level', 'Junior')
        for job in self.job_database:
            match_result = self._calculate_enhanced_match(
                user_skills=user_skills,
                user_experience=user_experience,
                user_level=user_level,
                job=job
            )
            if match_result['score'] >= 40:
                job_match = JobMatch(
                    job_id=job['id'],
                    title=job['title'],
                    company=job['company'],
                    location=job['location'],
                    salary_range=f"${job['salary_min']//1000}k - ${job['salary_max']//1000}k",
                    required_skills=job['required_skills'],
                    experience_required=f"{job['experience_years']}+ years",
                    match_percentage=match_result['score'],
                    description=job['description'],
                    job_type=job['job_type'],
                    remote=job['remote'],
                    posted_date=job['posted_date'].isoformat(),
                    skills_matched=match_result['skills_matched'],
                    skills_missing=match_result['skills_missing'],
                    experience_match=match_result['experience_match']
                )
                matches.append(job_match)
        matches.sort(key=lambda x: x.match_percentage, reverse=True)
        return matches[:15]
    
    async def search_jobs(self, skills: List[str] = None, experience: str = "", 
                         location: str = "", job_type: str = "", remote_only: bool = False) -> List[JobMatch]:
        filtered_jobs = self.job_database.copy()
        if skills:
            skills_lower = [skill.lower().strip() for skill in skills if skill.strip()]
            filtered_jobs = [
                job for job in filtered_jobs
                if any(skill in [req_skill.lower() for req_skill in job['required_skills'] + job.get('preferred_skills', [])] 
                      for skill in skills_lower)
            ]
        if location:
            location_lower = location.lower()
            filtered_jobs = [
                job for job in filtered_jobs
                if location_lower in job['location'].lower() or job['remote']
            ]
        if remote_only:
            filtered_jobs = [job for job in filtered_jobs if job['remote']]
        if job_type:
            filtered_jobs = [
                job for job in filtered_jobs
                if job['job_type'].lower() == job_type.lower()
            ]
        matches = []
        for job in filtered_jobs:
            skill_match_score = 75
            if skills:
                skills_lower = [skill.lower() for skill in skills]
                job_skills_lower = [skill.lower() for skill in job['required_skills']]
                matched_skills = [skill for skill in job_skills_lower if any(user_skill in skill for user_skill in skills_lower)]
                skill_match_score = min(95, (len(matched_skills) / len(job['required_skills'])) * 100)
            job_match = JobMatch(
                job_id=job['id'],
                title=job['title'],
                company=job['company'],
                location=job['location'],
                salary_range=f"${job['salary_min']//1000}k - ${job['salary_max']//1000}k",
                required_skills=job['required_skills'],
                experience_required=f"{job['experience_years']}+ years",
                match_percentage=int(skill_match_score),
                description=job['description'],
                job_type=job['job_type'],
                remote=job['remote'],
                posted_date=job['posted_date'].isoformat(),
                skills_matched=skills or [],
                skills_missing=[],
                experience_match=True
            )
            matches.append(job_match)
        matches.sort(key=lambda x: (x.match_percentage, x.posted_date), reverse=True)
        return matches
    
    def _calculate_enhanced_match(self, user_skills: List[str], user_experience: int, 
                                 user_level: str, job: Dict[str, Any]) -> Dict[str, Any]:
        required_skills = [skill.lower() for skill in job['required_skills']]
        preferred_skills = [skill.lower() for skill in job.get('preferred_skills', [])]
        skills_matched = []
        skills_missing = []
        for skill in required_skills:
            if any(user_skill in skill or skill in user_skill for user_skill in user_skills):
                skills_matched.append(skill.title())
            else:
                skills_missing.append(skill.title())
        for skill in preferred_skills:
            if any(user_skill in skill or skill in user_skill for user_skill in user_skills):
                if skill.title() not in skills_matched:
                    skills_matched.append(skill.title())
        required_skill_match = len([s for s in skills_matched if s.lower() in required_skills]) / len(required_skills) if required_skills else 0
        preferred_skill_match = len([s for s in skills_matched if s.lower() in preferred_skills]) / len(preferred_skills) if preferred_skills else 0
        skill_score = (required_skill_match * 0.8 + preferred_skill_match * 0.2) * 60
        job_experience = job['experience_years']
        experience_match = False
        if user_experience >= job_experience:
            exp_score = 25
            experience_match = True
        elif user_experience >= job_experience * 0.8:
            exp_score = 20
            experience_match = True
        elif user_experience >= job_experience * 0.6:
            exp_score = 15
        else:
            exp_score = 10
        level_score = self._calculate_level_match(user_level, job_experience) * 15
        total_score = skill_score + exp_score + level_score
        return {
            'score': min(int(total_score), 100),
            'skills_matched': skills_matched,
            'skills_missing': skills_missing,
            'experience_match': experience_match,
            'breakdown': {
                'skill_score': int(skill_score),
                'experience_score': int(exp_score),
                'level_score': int(level_score)
            }
        }
    
    def _calculate_level_match(self, user_level: str, job_experience: int) -> float:
        level_mapping = {
            'Junior': 1,
            'Mid-Level': 2,
            'Senior': 3
        }
        if job_experience >= 7:
            job_level = 3
        elif job_experience >= 3:
            job_level = 2
        else:
            job_level = 1
        user_level_score = level_mapping.get(user_level, 1)
        if user_level_score == job_level:
            return 1.0
        elif user_level_score > job_level:
            return 0.9
        elif user_level_score == job_level - 1:
            return 0.7
        else:
            return 0.4
    
    async def get_job_recommendations(self, resume_analysis: ResumeAnalysis) -> Dict[str, Any]:
        matches = await self.find_matches(resume_analysis)
        all_required_skills = set()
        all_preferred_skills = set()
        for job in self.job_database:
            all_required_skills.update(job['required_skills'])
            all_preferred_skills.update(job.get('preferred_skills', []))
        user_skills_lower = [skill.lower() for skill in resume_analysis.skills]
        skill_gaps = []
        for skill in all_required_skills:
            if not any(user_skill in skill.lower() or skill.lower() in user_skill for user_skill in user_skills_lower):
                job_count = sum(1 for job in self.job_database if skill in job['required_skills'])
                if job_count >= 2:
                    skill_gaps.append({
                        'skill': skill,
                        'job_count': job_count,
                        'priority': 'high' if job_count >= 4 else 'medium'
                    })
        skill_gaps.sort(key=lambda x: x['job_count'], reverse=True)
        return {
            'top_matches': matches[:5],
            'total_matches': len(matches),
            'skill_gaps': skill_gaps[:10],
            'career_level': resume_analysis.experience.get('level', 'Junior'),
            'recommended_salary_range': self._estimate_salary_range(resume_analysis),
            'market_demand': self._analyze_market_demand(resume_analysis.skills)
        }
    
    def _estimate_salary_range(self, resume_analysis: ResumeAnalysis) -> Dict[str, int]:
        user_skills = [skill.lower() for skill in resume_analysis.skills]
        experience_years = resume_analysis.experience.get('years', 0)
        relevant_jobs = []
        for job in self.job_database:
            job_skills = [skill.lower() for skill in job['required_skills']]
            skill_overlap = sum(1 for skill in job_skills if any(user_skill in skill for user_skill in user_skills))
            if skill_overlap >= len(job_skills) * 0.3:
                relevant_jobs.append(job)
        if not relevant_jobs:
            return {'min': 50000, 'max': 80000}
        salaries = []
        for job in relevant_jobs:
            exp_factor = min(1.2, experience_years / job['experience_years']) if job['experience_years'] > 0 else 1.0
            adjusted_min = int(job['salary_min'] * exp_factor)
            adjusted_max = int(job['salary_max'] * exp_factor)
            salaries.extend([adjusted_min, adjusted_max])
        return {
            'min': int(sum(salaries) * 0.25 / len(salaries)),
            'max': int(sum(salaries) * 0.75 / len(salaries))
        }
    
    def _analyze_market_demand(self, skills: List[str]) -> Dict[str, Any]:
        skill_demand = {}
        user_skills_lower = [skill.lower() for skill in skills]
        for skill in user_skills_lower:
            job_count = sum(1 for job in self.job_database 
                          if any(skill in req_skill.lower() for req_skill in job['required_skills']))
            if job_count > 0:
                if job_count >= 4:
                    demand_level = 'High'
                elif job_count >= 2:
                    demand_level = 'Medium'
                else:
                    demand_level = 'Low'
                skill_demand[skill.title()] = {
                    'job_count': job_count,
                    'demand_level': demand_level
                }
        total_demand = sum(data['job_count'] for data in skill_demand.values())
        avg_demand = total_demand / len(skill_demand) if skill_demand else 0
        if avg_demand >= 3:
            market_strength = 'Strong'
        elif avg_demand >= 2:
            market_strength = 'Moderate'
        else:
            market_strength = 'Developing'
        return {
            'skill_demand': skill_demand,
            'market_strength': market_strength,
            'total_opportunities': total_demand
        }
