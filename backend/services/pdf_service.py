import io
import logging
from typing import Optional
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)


async def extract_text_from_file(file_content: bytes, mime_type: str) -> Optional[str]:
    """Extract text content from a file based on its mime type."""
    try:
        if mime_type == "application/pdf":
            return extract_text_from_pdf(file_content)
        elif mime_type in ["text/plain", "text/markdown"]:
            return file_content.decode('utf-8', errors='ignore')
        else:
            logger.warning(f"Unsupported mime type: {mime_type}")
            return None
    except Exception as e:
        logger.error(f"Failed to extract text: {e}")
        return None


def extract_text_from_pdf(file_content: bytes) -> Optional[str]:
    """Extract text from a PDF file."""
    try:
        pdf_file = io.BytesIO(file_content)
        reader = PdfReader(pdf_file)
        
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        
        full_text = "\n\n".join(text_parts)
        return full_text if full_text.strip() else None
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return None
