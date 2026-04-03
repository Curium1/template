---
name: pdf
description: Toolkit for PDF processing operations including reading, filling forms, extracting structure, and creating validation images. Use this skill when the user asks to read, fill, extract, convert, or manipulate PDF files.
---

# PDF Processing Toolkit

A comprehensive toolkit for PDF processing operations using Python. Handles both fillable and non-fillable PDF forms.

## Prerequisites

Install required packages as needed:
```bash
pip install pypdf          # Core PDF reading/writing
pip install pdfplumber     # Structure extraction from non-fillable PDFs
pip install pdf2image      # PDF to image conversion
pip install Pillow         # Image manipulation for validation
```

For `pdf2image`, you also need `poppler`:
- **Windows**: Download from https://github.com/ossamamehmood/Poppler-windows/releases and add to PATH
- **macOS**: `brew install poppler`
- **Linux**: `sudo apt install poppler-utils`

## Workflow

### Decision Tree: Fillable vs Non-Fillable

```
1. Check if PDF has fillable fields:
   python .agents/skills/pdf/scripts/check_fillable_fields.py input.pdf

   ├── "Has fillable form fields" → Fillable Path (Step A)
   └── "Does not have fillable form fields" → Non-Fillable Path (Step B)
```

### Path A: Fillable PDF Forms

1. **Extract field information**:
   ```bash
   python .agents/skills/pdf/scripts/extract_form_field_info.py input.pdf fields_info.json
   ```
   This outputs JSON with field IDs, types (text/checkbox/radio/choice), pages, and coordinates.

2. **Prepare values JSON** — Create a JSON file mapping field IDs to values:
   ```json
   [
     {"field_id": "name", "page": 1, "value": "John Doe"},
     {"field_id": "agree_checkbox", "page": 1, "value": "/Yes"}
   ]
   ```

3. **Fill the PDF**:
   ```bash
   python .agents/skills/pdf/scripts/fill_fillable_fields.py input.pdf values.json output.pdf
   ```

### Path B: Non-Fillable PDF Forms

1. **Convert PDF to images** to understand the layout:
   ```bash
   python .agents/skills/pdf/scripts/convert_pdf_to_images.py input.pdf output_dir/
   ```

2. **Extract form structure** (labels, lines, checkboxes):
   ```bash
   python .agents/skills/pdf/scripts/extract_form_structure.py input.pdf structure.json
   ```

3. **Define fields JSON** with bounding boxes. Use the page images and structure data to determine where each field entry should go. Create a `fields.json`:
   ```json
   {
     "pages": [
       {"page_number": 1, "image_width": 1000, "image_height": 1414}
     ],
     "form_fields": [
       {
         "page_number": 1,
         "description": "Name",
         "label_bounding_box": [50, 100, 120, 120],
         "entry_bounding_box": [130, 100, 400, 120],
         "entry_text": {"text": "John Doe", "font_size": 12}
       }
     ]
   }
   ```

4. **Validate bounding boxes** (check for intersections):
   ```bash
   python .agents/skills/pdf/scripts/check_bounding_boxes.py fields.json
   ```

5. **Create validation image** to visually verify box placement:
   ```bash
   python .agents/skills/pdf/scripts/create_validation_image.py 1 fields.json page_1.png validation.png
   ```

6. **Fill the PDF** using text annotations:
   ```bash
   python .agents/skills/pdf/scripts/fill_pdf_form_with_annotations.py input.pdf fields.json output.pdf
   ```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `check_fillable_fields.py` | Check if a PDF has fillable form fields |
| `extract_form_field_info.py` | Extract field IDs, types, and locations from fillable PDFs |
| `fill_fillable_fields.py` | Fill fillable PDF form fields |
| `extract_form_structure.py` | Extract labels, lines, and checkboxes from non-fillable PDFs |
| `convert_pdf_to_images.py` | Convert PDF pages to PNG images |
| `check_bounding_boxes.py` | Validate bounding boxes for intersections |
| `create_validation_image.py` | Draw bounding boxes on page images for visual verification |
| `fill_pdf_form_with_annotations.py` | Fill non-fillable PDFs using text annotations |

## Coordinate Systems

- **Image coordinates**: Origin at top-left, Y increases downward
- **PDF coordinates**: Origin at bottom-left, Y increases upward
- The `fill_pdf_form_with_annotations.py` script handles the coordinate transformation automatically

## Best Practices

1. **Always check fillable fields first** — fillable PDFs are much easier to work with
2. **Convert to images** to understand the visual layout before defining bounding boxes
3. **Validate bounding boxes** before filling to catch intersection errors early
4. **Create validation images** to visually verify field placement
5. **Use the iterative cycle**: define boxes → validate → create image → verify → adjust → repeat
