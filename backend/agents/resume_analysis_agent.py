"""
DVT Talent AI — Resume Analysis Agent
Parses resumes, extracts structured data, and scores candidates against job descriptions.
Uses ChromaDB for vector similarity matching.
"""
import json
import base64
import re
from typing import Dict, List, Any, Optional

from agents.base_agent import BaseAgent
from config import settings


SYSTEM_PROMPT = """You are a world-class Resume Analysis Agent for DVT Talent AI.
Your job is to parse resumes and evaluate candidate fit for software engineering roles.

When analyzing a resume, you must:
1. Extract all structured data (contact info, skills, experience, education)
2. Calculate a detailed match score against the job description
3. Identify strengths and red flags
4. Write a brief AI recruiter summary
5. Estimate years of experience accurately

Scoring rubric (total 100 points):
- Skills match: 35 pts
- Experience level: 25 pts  
- Education & certifications: 15 pts
- Career progression: 15 pts
- Communication clarity: 10 pts

Return ONLY valid JSON. Be precise and critical — not every candidate is a 90+."""


class ResumeAnalysisAgent(BaseAgent):
    """
    AI Resume Analysis Agent that:
    1. Extracts text from PDF/DOCX resumes
    2. Parses structured data with AI
    3. Scores against job descriptions
    4. Stores embeddings in ChromaDB for similarity search
    """

    def __init__(self):
        super().__init__(
            name="resume_analysis",
            description="Parses and scores resumes against job descriptions using AI",
        )
        self._chroma_client = None

    @property
    def chroma(self):
        if self._chroma_client is None:
            import chromadb
            self._chroma_client = chromadb.HttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port,
            )
        return self._chroma_client

    def run(
        self,
        resume_text: str,
        job_description: Optional[str] = None,
        candidate_id: Optional[str] = None,
        resume_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        self.log_start(f"Analyzing resume for candidate {candidate_id}")

        try:
            # Parse resume
            parsed = self._parse_resume(resume_text)

            # Score against job description
            score_data = {}
            if job_description:
                score_data = self._score_against_job(resume_text, parsed, job_description)
            else:
                score_data = self._score_general_quality(resume_text, parsed)

            # Store embedding
            if candidate_id and resume_id:
                self._store_resume_embedding(resume_text, candidate_id, resume_id, parsed)

            result = {
                "parsed": parsed,
                "score": score_data.get("total_score", 0),
                "score_breakdown": score_data.get("breakdown", {}),
                "strengths": score_data.get("strengths", []),
                "red_flags": score_data.get("red_flags", []),
                "ai_summary": score_data.get("summary", ""),
                "recommended_roles": score_data.get("recommended_roles", []),
            }

            self.log_complete(f"Resume scored: {result['score']}/100")
            return result

        except Exception as e:
            self.log_error(e)
            return {"error": str(e), "score": 0}

    def _parse_resume(self, resume_text: str) -> dict:
        """Extract structured data from resume text"""
        user_prompt = f"""Parse this resume and extract all structured information.

Resume Text:
{resume_text[:6000]}

Return JSON:
{{
  "contact": {{
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin_url": "",
    "github_url": "",
    "portfolio_url": ""
  }},
  "summary": "Professional summary or objective",
  "experience": [
    {{
      "company": "",
      "title": "",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or present",
      "description": "",
      "achievements": [],
      "technologies": []
    }}
  ],
  "education": [
    {{
      "institution": "",
      "degree": "",
      "field": "",
      "graduation_year": 2020,
      "gpa": null
    }}
  ],
  "skills": {{
    "languages": [],
    "frameworks": [],
    "databases": [],
    "cloud": [],
    "tools": [],
    "soft_skills": []
  }},
  "certifications": [],
  "total_experience_years": 0,
  "seniority_level": "junior|mid|senior|lead|staff|principal"
}}"""

        try:
            response = self.chat(SYSTEM_PROMPT, user_prompt, json_mode=True, temperature=0.1)
            return json.loads(response)
        except Exception as e:
            self.log.warning("resume_parse_failed", error=str(e))
            return {}

    def _score_against_job(self, resume_text: str, parsed: dict, job_description: str) -> dict:
        """Score resume against specific job description"""
        user_prompt = f"""Score this candidate's resume against the job description.

JOB DESCRIPTION:
{job_description[:2000]}

CANDIDATE PROFILE:
- Skills: {json.dumps(parsed.get('skills', {}))}
- Experience: {parsed.get('total_experience_years', 0)} years
- Seniority: {parsed.get('seniority_level', 'unknown')}
- Recent roles: {json.dumps([e.get('title') for e in parsed.get('experience', [])[:3]])}

RESUME TEXT (excerpt):
{resume_text[:2000]}

Return JSON:
{{
  "total_score": 78,
  "breakdown": {{
    "skills_match": 28,
    "experience_level": 20,
    "education": 12,
    "career_progression": 12,
    "communication": 6
  }},
  "matched_skills": ["Python", "AWS"],
  "missing_skills": ["Kubernetes", "Go"],
  "strengths": ["Strong Python background", "Led team of 8 engineers"],
  "red_flags": ["Job hopping — 3 jobs in 2 years", "No cloud experience"],
  "summary": "Solid mid-level Python engineer with 4 years experience...",
  "recommended_roles": ["Senior Python Developer", "Backend Engineer"],
  "hiring_recommendation": "strong_yes|yes|maybe|no",
  "interview_focus": ["Assess system design skills", "Explore cloud experience gap"]
}}"""

        try:
            response = self.chat(SYSTEM_PROMPT, user_prompt, json_mode=True, temperature=0.2)
            return json.loads(response)
        except Exception as e:
            self.log.warning("scoring_failed", error=str(e))
            return {"total_score": 0}

    def _score_general_quality(self, resume_text: str, parsed: dict) -> dict:
        """Score resume for general quality without a specific JD"""
        user_prompt = f"""Score this software engineering resume for overall quality and marketability.

CANDIDATE PROFILE:
- Experience: {parsed.get('total_experience_years', 0)} years
- Skills: {json.dumps(parsed.get('skills', {}))}
- Seniority: {parsed.get('seniority_level', 'unknown')}

RESUME EXCERPT:
{resume_text[:3000]}

Return JSON:
{{
  "total_score": 72,
  "breakdown": {{
    "skills_match": 25,
    "experience_level": 18,
    "education": 11,
    "career_progression": 12,
    "communication": 6
  }},
  "strengths": [],
  "red_flags": [],
  "summary": "Recruiter-friendly summary paragraph...",
  "recommended_roles": ["Backend Engineer", "Python Developer"],
  "hiring_recommendation": "yes",
  "market_demand": "high|medium|low"
}}"""

        try:
            response = self.chat(SYSTEM_PROMPT, user_prompt, json_mode=True, temperature=0.2)
            return json.loads(response)
        except Exception as e:
            self.log.warning("general_scoring_failed", error=str(e))
            return {"total_score": 0}

    # FIX [P-02]: Class-level singleton — model loads once (~500MB, ~3s) not per call
    _embedding_model = None

    @classmethod
    def _get_embedding_model(cls):
        if cls._embedding_model is None:
            from sentence_transformers import SentenceTransformer
            cls._embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._embedding_model

    def _store_resume_embedding(
        self, resume_text: str, candidate_id: str, resume_id: str, parsed: dict
    ):
        """Store resume embedding in ChromaDB for similarity search"""
        try:
            model = self._get_embedding_model()
            embedding = model.encode(resume_text[:2000]).tolist()

            collection = self.chroma.get_or_create_collection(
                name=settings.chroma_collection_resumes
            )
            collection.add(
                embeddings=[embedding],
                documents=[resume_text[:2000]],
                metadatas=[{
                    "candidate_id": candidate_id,
                    "resume_id": resume_id,
                    "skills": json.dumps(parsed.get("skills", {})),
                    "experience_years": str(parsed.get("total_experience_years", 0)),
                    "seniority": parsed.get("seniority_level", "unknown"),
                }],
                ids=[resume_id],
            )
        except Exception as e:
            self.log.warning("embedding_storage_failed", error=str(e))

    def find_similar_candidates(self, job_description: str, top_k: int = 10) -> List[dict]:
        """Find candidates similar to a job description using vector search"""
        try:
            model = self._get_embedding_model()
            jd_embedding = model.encode(job_description[:2000]).tolist()

            collection = self.chroma.get_or_create_collection(
                name=settings.chroma_collection_resumes
            )
            results = collection.query(
                query_embeddings=[jd_embedding],
                n_results=top_k,
            )
            return [
                {
                    "candidate_id": results["metadatas"][0][i]["candidate_id"],
                    "resume_id": results["ids"][0][i],
                    "similarity_score": float(1 - results["distances"][0][i]),
                    "metadata": results["metadatas"][0][i],
                }
                for i in range(len(results["ids"][0]))
            ]
        except Exception as e:
            self.log.warning("similarity_search_failed", error=str(e))
            return []

    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes using PyMuPDF"""
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception:
            return ""

    @staticmethod
    def extract_text_from_docx(docx_bytes: bytes) -> str:
        """Extract text from DOCX bytes"""
        try:
            import io
            from docx import Document
            doc = Document(io.BytesIO(docx_bytes))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception:
            return ""
