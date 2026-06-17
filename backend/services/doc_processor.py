import os
import pypdf

def extract_text_from_pdf(file_path):
    """
    Extracts all text from a PDF file using pypdf.
    """
    text = []
    try:
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
        raise ValueError(f"Failed to parse PDF file: {str(e)}")
    
    return "\n\n".join(text)

def extract_text_from_txt(file_path):
    """
    Extracts text from a plain text or markdown file.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        # Fallback to latin-1 if utf-8 fails
        with open(file_path, 'r', encoding='latin-1') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading text file {file_path}: {e}")
        raise ValueError(f"Failed to parse text file: {str(e)}")

def process_file(file_path):
    """
    Detects file extension and extracts text accordingly.
    """
    _, ext = os.path.splitext(file_path.lower())
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.txt', '.md', '.markdown', '.json', '.html', '.css', '.js', '.py']:
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
