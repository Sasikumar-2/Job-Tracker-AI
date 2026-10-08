
import os
import json
from google import genai
from google.genai import types

def analyze_job_match(resume_text, job_description):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("Please provide a valid GEMINI_API_KEY in backend/.env")

    client = genai.Client(api_key=api_key)

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) reviewer.
    Analyze the following Candidate Resume against the target Job Description.

    CANDIDATE RESUME:
    {resume_text}

    JOB DESCRIPTION:
    {job_description}

    Provide your assessment strictly as a JSON object matching this schema:
    {{
        "match_score": <number between 0 and 100>,
        "matching_skills": ["skill1", "skill2"],
        "missing_skills": ["skill1", "skill2"],
        "tailored_summary": "<2-3 sentence overview on candidate fit>"
    }}
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    return json.loads(response.text)