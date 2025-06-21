#!/usr/bin/env python3
"""
Content Migration Parser for Ilse DeLange Records Website
Parses HTML files and extracts structured content for migration to Next.js
"""

import os
import re
import json
import html
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ContentParser:
    def __init__(self, source_dir, output_dir):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Content collections
        self.artists = {}
        self.albums = {}
        self.tracks = {}
        self.lyrics = {}
        self.images = {}
        self.pages = {}
        
        # Navigation structure from index.html
        self.navigation = {
            'ilse_delange': [
                'albums.html', 'singles.html', 'live.html', 
                'other artist.html', 'Various artist.html', 'items.html', 'lyrics.html'
            ],
            'common_linnets': [
                'tcl album.html', 'TCL singles.html', 'TCL other.html', 
                'TCL various.html', 'TCL lyrics.html'
            ]
        }
    
    def parse_html_file(self, file_path):
        """Parse individual HTML file and extract content"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract basic metadata
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ''
            
            meta_description = soup.find('meta', attrs={'name': 'description'})
            description = meta_description.get('content', '') if meta_description else ''
            
            meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
            keywords = meta_keywords.get('content', '') if meta_keywords else ''
            
            # Extract main content (skip navigation and headers)
            main_content = self.extract_main_content(soup)
            
            # Extract images referenced in this page
            images = self.extract_images(soup, file_path)
            
            # Determine content type based on filename and content
            content_type = self.determine_content_type(file_path, title_text, main_content)
            
            page_data = {
                'file_path': str(file_path),
                'title': title_text,
                'description': description,
                'keywords': keywords.split(',') if keywords else [],
                'content_type': content_type,
                'main_content': main_content,
                'images': images,
                'raw_html': content
            }
            
            return page_data
            
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            return None
    
    def extract_main_content(self, soup):
        """Extract main content text from HTML"""
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Find main content area (usually in divMain or similar)
        main_div = soup.find('div', id='divMain')
        if not main_div:
            main_div = soup.find('body')
        
        if main_div:
            # Remove navigation elements
            for nav in main_div.find_all(['nav', 'div'], class_=re.compile(r'nav|menu')):
                nav.decompose()
            
            # Extract text content
            text = main_div.get_text()
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return text
        
        return ""
    
    def extract_images(self, soup, file_path):
        """Extract image references from HTML"""
        images = []
        
        for img in soup.find_all('img'):
            src = img.get('src', '')
            alt = img.get('alt', '')
            
            if src:
                # Handle URL encoding
                src = unquote(src)
                
                # Convert relative paths to absolute
                if not src.startswith('http'):
                    img_path = self.source_dir / src
                    if img_path.exists():
                        images.append({
                            'src': src,
                            'alt': alt,
                            'file_path': str(img_path),
                            'exists': True
                        })
                    else:
                        images.append({
                            'src': src,
                            'alt': alt,
                            'file_path': str(img_path),
                            'exists': False
                        })
        
        return images
    
    def determine_content_type(self, file_path, title, content):
        """Determine the type of content based on filename and content"""
        filename = file_path.name.lower()
        title_lower = title.lower()
        content_lower = content.lower()
        
        if 'lyric' in filename:
            return 'lyrics'
        elif 'album' in filename:
            return 'album'
        elif 'single' in filename:
            return 'single'
        elif 'tcl' in filename:
            return 'tcl_content'
        elif filename == 'index.html':
            return 'homepage'
        elif 'live' in filename:
            return 'live'
        elif 'various' in filename:
            return 'various_artist'
        elif 'other' in filename:
            return 'other_artist'
        elif 'items' in filename:
            return 'items'
        else:
            return 'page'
    
    def parse_all_files(self):
        """Parse all HTML files in the source directory"""
        html_files = list(self.source_dir.glob('*.html'))
        
        logger.info(f"Found {len(html_files)} HTML files to parse")
        
        for file_path in html_files:
            logger.info(f"Parsing {file_path.name}")
            page_data = self.parse_html_file(file_path)
            
            if page_data:
                self.pages[file_path.name] = page_data
        
        logger.info(f"Parsed {len(self.pages)} pages successfully")
    
    def create_content_inventory(self):
        """Create comprehensive content inventory"""
        inventory = {
            'summary': {
                'total_pages': len(self.pages),
                'content_types': {},
                'total_images': 0,
                'missing_images': 0
            },
            'pages': self.pages,
            'navigation': self.navigation
        }
        
        # Count content types
        for page in self.pages.values():
            content_type = page['content_type']
            if content_type not in inventory['summary']['content_types']:
                inventory['summary']['content_types'][content_type] = 0
            inventory['summary']['content_types'][content_type] += 1
            
            # Count images
            for img in page['images']:
                inventory['summary']['total_images'] += 1
                if not img['exists']:
                    inventory['summary']['missing_images'] += 1
        
        return inventory
    
    def save_inventory(self, inventory):
        """Save content inventory to JSON file"""
        output_file = self.output_dir / 'content_inventory.json'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(inventory, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Content inventory saved to {output_file}")
        
        # Also create a summary report
        self.create_summary_report(inventory)
    
    def create_summary_report(self, inventory):
        """Create human-readable summary report"""
        summary = inventory['summary']
        
        report = f"""# Content Migration Inventory Report

## Summary
- **Total Pages**: {summary['total_pages']}
- **Total Images**: {summary['total_images']}
- **Missing Images**: {summary['missing_images']}

## Content Types
"""
        
        for content_type, count in summary['content_types'].items():
            report += f"- **{content_type.replace('_', ' ').title()}**: {count} pages\n"
        
        report += "\n## Page Details\n\n"
        
        for filename, page in inventory['pages'].items():
            report += f"### {filename}\n"
            report += f"- **Title**: {page['title']}\n"
            report += f"- **Type**: {page['content_type']}\n"
            report += f"- **Images**: {len(page['images'])}\n"
            if page['description']:
                report += f"- **Description**: {page['description'][:100]}...\n"
            report += "\n"
        
        report_file = self.output_dir / 'migration_report.md'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"Migration report saved to {report_file}")

def main():
    source_dir = "/home/ubuntu/old_website"
    output_dir = "/home/ubuntu/migration_data"
    
    parser = ContentParser(source_dir, output_dir)
    parser.parse_all_files()
    
    inventory = parser.create_content_inventory()
    parser.save_inventory(inventory)
    
    print(f"Content parsing complete!")
    print(f"Total pages: {inventory['summary']['total_pages']}")
    print(f"Total images: {inventory['summary']['total_images']}")
    print(f"Missing images: {inventory['summary']['missing_images']}")

if __name__ == "__main__":
    main()

