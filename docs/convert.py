#!/usr/bin/env python3
"""
Convert Markdown to HTML
Usage: python3 convert.py
"""

import re
import sys
from pathlib import Path

class MarkdownToHTML:
    def __init__(self, markdown_file, output_file="index.html"):
        self.markdown_file = Path(markdown_file)
        self.output_file = Path(output_file)
        self.content = ""
        
    def read_markdown(self):
        """Read markdown file"""
        with open(self.markdown_file, 'r', encoding='utf-8') as f:
            self.content = f.read()
        return self.content
    
    def convert(self):
        """Convert markdown to HTML"""
        html = self.content
        
        # Headers
        html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
        html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
        html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
        
        # Bold and italic
        html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
        html = re.sub(r'__(.*?)__', r'<strong>\1</strong>', html)
        html = re.sub(r'_(.*?)_', r'<em>\1</em>', html)
        
        # Code blocks (```...```)
        html = re.sub(
            r'```(.*?)\n(.*?)\n```',
            r'<pre><code class="language-\1">\2</code></pre>',
            html,
            flags=re.DOTALL
        )
        
        # Inline code
        html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
        
        # Links
        html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', html)
        
        # Lists
        lines = html.split('\n')
        new_lines = []
        in_list = False
        in_ol = False
        
        for line in lines:
            if re.match(r'^\d+\. ', line):
                if not in_ol:
                    new_lines.append('<ol>')
                    in_ol = True
                    in_list = True
                item = re.sub(r'^\d+\. ', '', line)
                new_lines.append(f'<li>{item}</li>')
            elif re.match(r'^- ', line):
                if not in_list or in_ol:
                    if in_ol:
                        new_lines.append('</ol>')
                        in_ol = False
                    new_lines.append('<ul>')
                    in_list = True
                item = re.sub(r'^- ', '', line)
                new_lines.append(f'<li>{item}</li>')
            else:
                if in_list:
                    if in_ol:
                        new_lines.append('</ol>')
                        in_ol = False
                    else:
                        new_lines.append('</ul>')
                    in_list = False
                new_lines.append(line)
        
        if in_list:
            if in_ol:
                new_lines.append('</ol>')
            else:
                new_lines.append('</ul>')
        
        html = '\n'.join(new_lines)
        
        # Paragraphs
        html = re.sub(r'\n\n+', '</p>\n<p>', html)
        html = '<p>' + html + '</p>'
        html = html.replace('<p></p>', '')
        
        # Remove extra tags
        html = re.sub(r'<p>(<h[1-6])', r'\1', html)
        html = re.sub(r'(</h[1-6]>)</p>', r'\1', html)
        html = re.sub(r'<p>(<pre)', r'\1', html)
        html = re.sub(r'(</pre>)</p>', r'\1', html)
        html = re.sub(r'<p>(<ul|<ol)', r'\1', html)
        html = re.sub(r'(</ul|</ol>)</p>', r'\1', html)
        
        return html
    
    def generate_html(self):
        """Generate complete HTML file"""
        body = self.convert()
        
        html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KAIROS Framework v2.0</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }}
        
        .container {{
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
            min-height: 100vh;
        }}
        
        h1 {{
            color: #003D7A;
            margin: 30px 0 10px 0;
            font-size: 2.5em;
        }}
        
        h2 {{
            color: #003D7A;
            margin: 30px 0 15px 0;
            font-size: 1.8em;
        }}
        
        h3 {{
            color: #00BCD4;
            margin: 20px 0 10px 0;
            font-size: 1.3em;
        }}
        
        p {{
            margin-bottom: 15px;
            color: #555;
        }}
        
        ul, ol {{
            margin-left: 20px;
            margin-bottom: 15px;
        }}
        
        li {{
            margin-bottom: 8px;
            color: #555;
        }}
        
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d63384;
        }}
        
        pre {{
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            border-left: 4px solid #003D7A;
        }}
        
        pre code {{
            background: none;
            padding: 0;
            color: #333;
        }}
        
        a {{
            color: #00BCD4;
            text-decoration: none;
            border-bottom: 1px solid #00BCD4;
        }}
        
        a:hover {{
            color: #003D7A;
            border-bottom-color: #003D7A;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }}
        
        table th, table td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        
        table th {{
            background: #f4f4f4;
            font-weight: bold;
            color: #003D7A;
        }}
        
        table tr:hover {{
            background: #f9f9f9;
        }}
        
        strong {{
            color: #003D7A;
            font-weight: bold;
        }}
        
        em {{
            font-style: italic;
            color: #666;
        }}
        
        hr {{
            margin: 30px 0;
            border: none;
            border-top: 1px solid #ddd;
        }}
        
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #003D7A;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }}
        
        @media (max-width: 768px) {{
            h1 {{ font-size: 1.8em; }}
            h2 {{ font-size: 1.4em; }}
            .container {{ padding: 20px 15px; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        {body}
        <div class="footer">
            <p>KAIROS Framework v2.0 | © Comm.it 2026</p>
            <p>"The Right Moment for Development" 🚀</p>
        </div>
    </div>
</body>
</html>"""
        return html_template
    
    def save_html(self):
        """Save HTML to file"""
        html = self.generate_html()
        with open(self.output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"✅ HTML generated: {self.output_file}")

def main():
    # Get markdown file
    md_file = "KAIROS-FRAMEWORK-DOCUMENTATION.md"
    
    if not Path(md_file).exists():
        print(f"❌ Error: {md_file} not found")
        print("Make sure you run this script from the docs/ folder")
        sys.exit(1)
    
    # Convert
    converter = MarkdownToHTML(md_file)
    converter.read_markdown()
    converter.save_html()
    
    print("\n✅ Conversion complete!")
    print("   - Input: KAIROS-FRAMEWORK-DOCUMENTATION.md")
    print("   - Output: index.html")
    print("\nYou can now deploy to Vercel/Netlify/GitHub Pages")

if __name__ == "__main__":
    main()
