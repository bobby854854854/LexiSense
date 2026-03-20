import os
import json
import logging
from typing import Optional, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

CONTRACT_ANALYSIS_PROMPT = """You are an expert legal contract analyzer. Analyze the following contract and return a JSON object with the following structure:
{
  "summary": "A brief 2-3 sentence summary of what this contract is about",
  "parties": ["List of parties involved in the contract"],
  "keyTerms": ["List of key terms and conditions"],
  "risks": [
    {"risk": "Description of risk", "severity": "high/medium/low", "recommendation": "How to mitigate"}
  ],
  "dates": {
    "effectiveDate": "YYYY-MM-DD or null",
    "expiryDate": "YYYY-MM-DD or null",
    "renewalDate": "YYYY-MM-DD or null"
  },
  "value": "Contract value if mentioned, or null",
  "riskLevel": "high/medium/low based on overall assessment",
  "recommendations": ["List of recommendations for review"]
}

Return ONLY valid JSON, no additional text."""

CHAT_SYSTEM_PROMPT = """You are a helpful legal assistant specialized in contract analysis. 
Answer questions about the provided contract clearly and accurately.
If you're unsure about something, say so. Always base your answers on the contract text provided.
Be concise but thorough in your responses."""


async def analyze_contract(contract_text: str) -> Optional[Dict[str, Any]]:
    """Analyze a contract using GPT-5.2 and return structured insights."""
    if not EMERGENT_LLM_KEY:
        logger.error("EMERGENT_LLM_KEY not configured")
        return None
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"contract-analysis-{id(contract_text)}",
            system_message=CONTRACT_ANALYSIS_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        truncated_text = contract_text[:8000] if len(contract_text) > 8000 else contract_text
        
        user_message = UserMessage(
            text=f"Analyze this contract:\n\n{truncated_text}"
        )
        
        response = await chat.send_message(user_message)
        
        try:
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            
            analysis = json.loads(clean_response.strip())
            return analysis
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return {
                "summary": response[:500] if response else "Analysis failed",
                "riskLevel": "unknown",
                "error": "Could not parse structured analysis"
            }
            
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return None


async def get_chat_response(contract_text: str, question: str, session_id: str) -> str:
    """Get an AI response to a question about a contract."""
    if not EMERGENT_LLM_KEY:
        raise ValueError("EMERGENT_LLM_KEY not configured")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=CHAT_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        truncated_text = contract_text[:6000] if len(contract_text) > 6000 else contract_text
        
        user_message = UserMessage(
            text=f"Contract Text:\n{truncated_text}\n\nQuestion: {question}"
        )
        
        response = await chat.send_message(user_message)
        return response or "I couldn't generate a response. Please try again."
        
    except Exception as e:
        logger.error(f"Chat response failed: {e}")
        raise ValueError(f"Unable to process question: {str(e)}")
