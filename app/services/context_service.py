import io
from pypdf import PdfReader
from docx import Document

def parse_resume(file_bytes: bytes, filename: str) -> str:
    """
    Parses PDF or Docx bytes and returns plain text.
    """
    text = ""
    try:
        if filename.lower().endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif filename.lower().endswith(".docx"):
            doc = Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        return text.strip()
    except Exception as e:
        print(f"[Context] Error parsing file {filename}: {e}")
        return ""
