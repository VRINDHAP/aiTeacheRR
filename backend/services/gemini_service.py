import os
import json
import google.generativeai as genai

def get_gemini_client(api_key=None):
    """
    Configures and returns the gemini library using the provided key,
    or falls back to the GEMINI_API_KEY environment variable.
    """
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("Gemini API key is missing. Please set it in your environment or provide it in the request headers.")
    genai.configure(api_key=key)
    return genai

def generate_chat_response(api_key, prompt, history=None, context=None):
    """
    Generates a conversational response from Gemini.
    Injects context from uploaded documents if available.
    """
    client = get_gemini_client(api_key)
    
    # We will use gemini-1.5-flash as it is extremely fast and cost-effective
    model_name = "gemini-1.5-flash"
    
    system_instruction = (
        "You are an encouraging, highly knowledgeable, and friendly AI Teacher Avatar. "
        "Your goal is to explain concepts clearly, step-by-step, using simple yet professional language. "
        "Keep your answers concise, engaging, and suitable for verbal explanation. "
        "Use Markdown formatting (like bolding, lists, and code blocks) for the visual chat transcript, "
        "but ensure it reads naturally when spoken out loud.\n\n"
        "Crucial Avatar Animation Instructions:\n"
        "At the very beginning of your response, you MUST include one of the following expressions to indicate "
        "your facial state: [EXPRESSION: happy], [EXPRESSION: explaining], [EXPRESSION: thinking], [EXPRESSION: listening], [EXPRESSION: sad]. "
        "For example: '[EXPRESSION: explaining] Let me break that down for you...' "
        "Choose the expression that best fits the tone of your message. If the student answers something well or asks something cheerful, "
        "use [EXPRESSION: happy]. If you are introducing a difficult topic or correcting a mistake, use [EXPRESSION: explaining]. "
        "Only output exactly one expression tag at the very start."
    )
    
    # Format the prompt with context
    full_prompt = ""
    if context:
        full_prompt += f"--- STUDY MATERIAL REFERENCE CONTEXT ---\n{context}\n---------------------------------------\n\n"
        full_prompt += "Base your answers on the Study Material Reference Context provided above whenever relevant.\n\n"
    
    full_prompt += prompt
    
    # Set up contents list with history if present
    contents = []
    if history:
        for turn in history:
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": turn.get("text", "")}]
            })
    
    contents.append({
        "role": "user",
        "parts": [{"text": full_prompt}]
    })
    
    model = client.GenerativeModel(
        model_name=model_name,
        system_instruction=system_instruction
    )
    
    response = model.generate_content(contents)
    return response.text

def generate_quiz(api_key, topic_or_context, count=5):
    """
    Generates a structured JSON multiple-choice quiz based on the topic or context provided.
    """
    client = get_gemini_client(api_key)
    
    model_name = "gemini-1.5-flash"
    
    prompt = (
        f"Generate a multiple-choice quiz containing exactly {count} questions based on the following topic or source material:\n"
        f"\"\"\"\n{topic_or_context}\n\"\"\"\n\n"
        "The quiz must be returned as a raw JSON object conforming strictly to this structure:\n"
        "{\n"
        '  "quiz_title": "A short, engaging title for the quiz",\n'
        '  "questions": [\n'
        "    {\n"
        '      "question_text": "The text of the question?",\n'
        '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '      "correct_option_index": 0,\n'
        '      "explanation": "Detailed explanation of why this option is correct and why others are incorrect."\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Ensure there are exactly 4 choices per question. The correct_option_index must be a 0-indexed integer (0, 1, 2, or 3).\n"
        "Return ONLY the raw JSON object. Do not wrap it in markdown code blocks like ```json."
    )
    
    model = client.GenerativeModel(model_name=model_name)
    
    # We use response_mime_type to force JSON formatting
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    
    try:
        quiz_data = json.loads(response.text)
        return quiz_data
    except Exception as e:
        print(f"Error parsing Gemini quiz JSON: {e}")
        print("Raw response text:", response.text)
        # Attempt recovery or throw exception
        raise ValueError(f"Failed to generate structured quiz JSON: {str(e)}")
