import PyPDF2
import pymongo
import re
import sys

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["file-db"]
collection = db["files-data"]

def extract_data_from_pdf(pdf_path):
    # Open the PDF file
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text()

    # Extract key-value pairs using regex
    data = {}
    lines = extracted_text.split("\n")
    for line in lines:
        match = re.match(r"(.+?)\s*:\s*(.+)", line)
        if match:
            key, value = match.groups()
            data[key.strip()] = value.strip()

    return data

def save_to_mongodb(data):
    if data:
        collection.insert_one(data)
        print("Data saved to MongoDB successfully:", data)
    else:
        print("No data to save.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_pdf.py <pdf_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    extracted_data = extract_data_from_pdf(pdf_path)
    print("Extracted Data:", extracted_data)
    save_to_mongodb(extracted_data)
