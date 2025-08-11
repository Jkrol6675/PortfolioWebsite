import sys
import subprocess
import os


def ensure_pkg(pkg: str) -> None:
    try:
        __import__(pkg)
    except Exception:
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", pkg], check=False)


def extract_pdf_text(pdf_path: str) -> str:
    try:
        from pdfminer.high_level import extract_text  # type: ignore
    except Exception:
        ensure_pkg("pdfminer.six")
        from pdfminer.high_level import extract_text  # type: ignore
    try:
        return extract_text(pdf_path)
    except Exception as e:
        # Fallback to pypdf
        try:
            ensure_pkg("pypdf")
            from pypdf import PdfReader  # type: ignore
            reader = PdfReader(open(pdf_path, "rb"))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            raise e


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python extract_resume.py <pdf_path> <out_text_path>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    out_path = sys.argv[2]
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    text = extract_pdf_text(pdf_path)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Wrote resume text to {out_path} ({len(text)} chars)")


if __name__ == "__main__":
    main()
