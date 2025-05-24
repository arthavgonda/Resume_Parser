from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime
from resume_parser import ImprovedResumeParser
from ai_analyzer import ImprovedAIAnalyzer
from job_matcher import EnhancedJobMatcher
from models import ResumeAnalysis, JobMatch, ContactInfo

app = FastAPI(title="Improved AI Resume Analyzer", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resume_parser = ImprovedResumeParser()
ai_analyzer = ImprovedAIAnalyzer()
job_matcher = EnhancedJobMatcher()

@app.get("/")
async def root():
    return {
        "message": "Improved AI Resume Analyzer API", 
        "status": "running",
        "version": "3.0.0",
        "features": [
            "Enhanced PDF/DOCX parsing for all formats",
            "Improved contact extraction (Australian & international)",
            "Better skill detection (including soft skills)",
            "Student resume support",
            "Adaptive scoring system",
            "Enhanced job matching"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "parser": "improved",
            "analyzer": "improved", 
            "job_matcher": "enhanced"
        }
    }

@app.post("/upload-resume", response_model=Dict[str, Any])
async def upload_resume(file: UploadFile = File(...)):
    try:
        allowed_types = [
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Only PDF and DOCX files are supported"
            )
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum 10MB allowed."
            )
        file_extension = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        try:
            print(f"Processing file: {file.filename}")
            resume_text = resume_parser.extract_text(tmp_file_path, file.content_type, max_pages=10)
            print(f"Extracted text length: {len(resume_text)}")
            if not resume_text or len(resume_text.strip()) < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract meaningful text from the file. Please ensure the file is not corrupted."
                )
            contact_info = resume_parser.extract_contact_info(resume_text)
            print(f"Extracted contact: {contact_info}")
            professional_summary = resume_parser.extract_professional_summary(resume_text)
            print(f"Extracted summary: {professional_summary[:100] if professional_summary else 'None'}...")
            skills = resume_parser.extract_skills(resume_text)
            print(f"Extracted skills: {skills}")
            education_info = resume_parser.extract_education_info(resume_text)
            print(f"Extracted education info: {education_info}")
            analysis = await ai_analyzer.analyze_resume(resume_text, contact_info)
            print(f"Analysis complete - Score: {analysis.score}")
            if education_info['institutions']:
                analysis.education['institution'] = education_info['institutions'][0]
            if education_info['fields']:
                analysis.education['field_of_study'] = education_info['fields'][0]
            job_matches = await job_matcher.find_matches(analysis)
            print(f"Found {len(job_matches)} job matches")
            os.unlink(tmp_file_path)
            response_data = {
                "success": True,
                "analysis": {
                    "contact": contact_info,
                    "skills": skills,
                    "professional_summary": professional_summary or analysis.summary,
                    "experience": analysis.experience,
                    "education": analysis.education,
                    "score": analysis.score,
                    "analysis_date": analysis.analysis_date
                },
                "job_matches": [job.dict() for job in job_matches],
                "metadata": {
                    "file_name": file.filename,
                    "file_size": len(content),
                    "text_length": len(resume_text),
                    "processing_time": datetime.now().isoformat(),
                    "parser_version": "3.0.0",
                    "features_detected": {
                        "has_contact_info": bool(contact_info.get('name') or contact_info.get('email')),
                        "has_professional_summary": bool(professional_summary),
                        "skills_count": len(skills),
                        "experience_years": analysis.experience.get('years', 0),
                        "education_level": analysis.education.get('highest_degree'),
                        "resume_type": analysis.experience.get('level', 'Professional')
                    }
                }
            }
            if len(resume_text) > 300:
                response_data["text_preview"] = resume_text[:300] + "..."
            else:
                response_data["text_preview"] = resume_text
            return response_data
        except Exception as e:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
            print(f"Processing error: {str(e)}")
            if isinstance(e, HTTPException):
                raise e
            error_msg = str(e)
            if "PDF" in error_msg:
                error_msg = "Failed to parse PDF file. The file may be corrupted, password-protected, or contain only images."
            elif "DOCX" in error_msg:
                error_msg = "Failed to parse DOCX file. The file may be corrupted."
            elif "text" in error_msg.lower():
                error_msg = "Could not extract readable text from the file. Please ensure the document contains text and is not just images."
            raise HTTPException(status_code=500, detail=f"Error processing resume: {error_msg}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/analyze-text")
async def analyze_resume_text(data: Dict[str, str]):
    try:
        resume_text = data.get("text", "").strip()
        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume text is required")
        if len(resume_text) < 50:
            raise HTTPException(status_code=400, detail="Resume text is too short. Please provide more content (minimum 50 characters).")
        print(f"Analyzing text of length: {len(resume_text)}")
        contact_info = resume_parser.extract_contact_info(resume_text)
        print(f"Extracted contact: {contact_info}")
        professional_summary = resume_parser.extract_professional_summary(resume_text)
        print(f"Extracted summary: {professional_summary[:100] if professional_summary else 'None'}...")
        skills = resume_parser.extract_skills(resume_text)
        print(f"Extracted skills: {skills}")
        education_info = resume_parser.extract_education_info(resume_text)
        print(f"Extracted education info: {education_info}")
        analysis = await ai_analyzer.analyze_resume(resume_text, contact_info)
        print(f"Analysis complete - Score: {analysis.score}")
        if education_info['institutions']:
            analysis.education['institution'] = education_info['institutions'][0]
        if education_info['fields']:
            analysis.education['field_of_study'] = education_info['fields'][0]
        job_matches = await job_matcher.find_matches(analysis)
        print(f"Found {len(job_matches)} job matches")
        return {
            "success": True,
            "analysis": {
                "contact": contact_info,
                "skills": skills,
                "professional_summary": professional_summary or analysis.summary,
                "experience": analysis.experience,
                "education": analysis.education,
                "score": analysis.score,
                "analysis_date": analysis.analysis_date
            },
            "job_matches": [job.dict() for job in job_matches],
            "metadata": {
                "text_length": len(resume_text),
                "processing_time": datetime.now().isoformat(),
                "parser_version": "3.0.0",
                "features_detected": {
                    "has_contact_info": bool(contact_info.get('name') or contact_info.get('email')),
                    "has_professional_summary": bool(professional_summary),
                    "skills_count": len(skills),
                    "experience_years": analysis.experience.get('years', 0),
                    "education_level": analysis.education.get('highest_degree'),
                    "resume_type": analysis.experience.get('level', 'Professional')
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Text analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@app.get("/jobs/search")
async def search_jobs(skills: str = "", experience: str = "", location: str = ""):
    try:
        skills_list = []
        if skills:
            skills_list = [skill.strip() for skill in skills.split(",") if skill.strip()]
        jobs = await job_matcher.search_jobs(
            skills=skills_list,
            experience=experience,
            location=location
        )
        return {
            "success": True,
            "jobs": [job.dict() for job in jobs],
            "total_found": len(jobs),
            "search_criteria": {
                "skills": skills_list,
                "experience": experience,
                "location": location
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Job search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching jobs: {str(e)}")

@app.post("/extract-contact")
async def extract_contact_only(data: Dict[str, str]):
    try:
        resume_text = data.get("text", "").strip()
        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume text is required")
        contact_info = resume_parser.extract_contact_info(resume_text)
        return {
            "success": True,
            "contact": contact_info,
            "extracted_at": datetime.now().isoformat(),
            "text_length": len(resume_text)
        }
    except Exception as e:
        print(f"Contact extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting contact: {str(e)}")

@app.post("/extract-skills")
async def extract_skills_only(data: Dict[str, str]):
    try:
        resume_text = data.get("text", "").strip()
        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume text is required")
        skills = resume_parser.extract_skills(resume_text)
        categorized_skills = {}
        for category, skill_list in resume_parser.skill_patterns.items():
            category_skills = []
            for skill in skills:
                if skill.lower() in [s.lower() for s in skill_list]:
                    category_skills.append(skill)
            if category_skills:
                categorized_skills[category.replace('_', ' ').title()] = category_skills
        return {
            "success": True,
            "skills": skills,
            "categorized_skills": categorized_skills,
            "skill_count": len(skills),
            "extracted_at": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Skills extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting skills: {str(e)}")

@app.get("/supported-skills")
async def get_supported_skills():
    try:
        skill_categories = {}
        total_skills = 0
        for category, skills in resume_parser.skill_patterns.items():
            formatted_category = category.replace('_', ' ').title()
            skill_categories[formatted_category] = {
                "skills": skills,
                "count": len(skills)
            }
            total_skills += len(skills)
        return {
            "skill_categories": skill_categories,
            "total_skills": total_skills,
            "categories_count": len(skill_categories),
            "version": "3.0.0"
        }
    except Exception as e:
        print(f"Supported skills error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving supported skills: {str(e)}")

@app.post("/debug-parsing")
async def debug_resume_parsing(file: UploadFile = File(...)):
    try:
        allowed_types = [
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Only PDF and DOCX files are supported"
            )
        content = await file.read()
        file_extension = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        try:
            resume_text = resume_parser.extract_text(tmp_file_path, file.content_type)
            contact_info = resume_parser.extract_contact_info(resume_text)
            skills = resume_parser.extract_skills(resume_text)
            professional_summary = resume_parser.extract_professional_summary(resume_text)
            os.unlink(tmp_file_path)
            return {
                "success": True,
                "debug_info": {
                    "file_name": file.filename,
                    "file_size": len(content),
                    "extracted_text": resume_text,
                    "text_length": len(resume_text),
                    "contact_extraction": contact_info,
                    "skills_extraction": skills,
                    "summary_extraction": professional_summary,
                    "parsing_steps": {
                        "1_text_extraction": "✓ Completed",
                        "2_contact_parsing": "✓ Completed",
                        "3_skills_parsing": "✓ Completed", 
                        "4_summary_parsing": "✓ Completed"
                    }
                }
            }
        except Exception as e:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
            raise e
    except Exception as e:
        print(f"Debug parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug parsing error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Improved AI Resume Analyzer")
    print("📋 Features:")
    print("   • Enhanced PDF/DOCX parsing")
    print("   • Australian phone format support")
    print("   • Student resume optimization")
    print("   • Soft skills detection")
    print("   • Adaptive scoring system")
    print("   • Better job matching")
    print("\n🌐 Server will be available at:")
    print("   • API: http://localhost:8000")
    print("   • Docs: http://localhost:8000/docs")
    print("   • Debug: http://localhost:8000/debug-parsing")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )
