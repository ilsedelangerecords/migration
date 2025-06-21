#!/usr/bin/env python3
"""
Complete repository cloner and content extractor for Ilse DeLange Records website.
This script clones the old_website repository and extracts all albums, images, and content.
"""

import os
import json
import shutil
import subprocess
import re
from pathlib import Path
from bs4 import BeautifulSoup
import requests

def run_command(cmd, cwd=None):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Command failed: {cmd}")
            print(f"Error: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"Error running command {cmd}: {e}")
        return False

def clone_repository():
    """Clone the old_website repository."""
    repo_url = "https://github.com/ilsedelangerecords/old_website.git"
    clone_dir = "migration_data/old_website_clone"
    
    # Remove existing clone if it exists
    if os.path.exists(clone_dir):
        print(f"Removing existing clone directory: {clone_dir}")
        shutil.rmtree(clone_dir)
    
    print(f"Cloning repository: {repo_url}")
    cmd = f"git clone {repo_url} {clone_dir}"
    
    if run_command(cmd):
        print("Repository cloned successfully!")
        return clone_dir
    else:
        print("Failed to clone repository")
        return None

def extract_text_content(soup):
    """Extract clean text content from HTML."""
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.decompose()
    
    # Get text and clean it up
    text = soup.get_text()
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = ' '.join(chunk for chunk in chunks if chunk)
    
    return text

def parse_album_info(soup, filename):
    """Parse album information from HTML soup."""
    album_info = {
        "title": "",
        "artist": "Ilse DeLange",
        "year": "",
        "label": "",
        "catalog": "",
        "tracks": [],
        "images": [],
        "description": "",
        "category": "album",
        "source_file": filename
    }
    
    # Extract title from various sources
    title_elem = soup.find('title')
    if title_elem:
        album_info["title"] = title_elem.get_text().strip()
    
    # Look for meta description
    meta_desc = soup.find('meta', {'name': 'description'})
    if meta_desc:
        album_info["description"] = meta_desc.get('content', '').strip()
    
    # Extract text content for analysis
    text_content = extract_text_content(soup)
    
    # Look for year patterns
    year_patterns = [r'Released?:?\s*(\d{4})', r'Year:?\s*(\d{4})', r'\b(19\d{2}|20\d{2})\b']
    for pattern in year_patterns:
        match = re.search(pattern, text_content, re.IGNORECASE)
        if match:
            album_info["year"] = match.group(1)
            break
    
    # Look for record label
    label_patterns = [r'Record label:?\s*([^\n\r]+)', r'Label:?\s*([^\n\r]+)']
    for pattern in label_patterns:
        match = re.search(pattern, text_content, re.IGNORECASE)
        if match:
            album_info["label"] = match.group(1).strip()
            break
    
    # Look for catalog number
    catalog_patterns = [r'Catalog number:?\s*([^\n\r]+)', r'Cat\.?\s*no\.?:?\s*([^\n\r]+)']
    for pattern in catalog_patterns:
        match = re.search(pattern, text_content, re.IGNORECASE)
        if match:
            album_info["catalog"] = match.group(1).strip()
            break
    
    # Extract track listings
    track_patterns = [
        r'\d{2}:\s*([^\n\r\(]+)(?:\s*\([\d:]+\))?',
        r'\d+\.\s*([^\n\r\(]+)(?:\s*\([\d:]+\))?'
    ]
    
    for pattern in track_patterns:
        matches = re.findall(pattern, text_content)
        if matches:
            album_info["tracks"] = [track.strip() for track in matches]
            break
    
    # Find all images
    img_tags = soup.find_all('img')
    for img in img_tags:
        src = img.get('src', '')
        if src and not src.startswith('wpimages/') and not src.startswith('wpscripts/'):
            # Clean up image paths
            clean_src = src.replace('%20', ' ').replace('%2C', ',')
            if clean_src not in album_info["images"]:
                album_info["images"].append(clean_src)
    
    return album_info

def categorize_album(filename, title, text_content):
    """Categorize the album based on filename and content."""
    filename_lower = filename.lower()
    title_lower = title.lower()
    content_lower = text_content.lower()
    
    # Define category keywords
    categories = {
        "single": ["single", "singles"],
        "live": ["live", "concert", "ahoy", "gelredome", "amsterdam"],
        "compilation": ["hits", "collection", "best of", "greatest", "various", "compilation"],
        "collaboration": ["common linnets", "tcl", "other artist", "featuring", "with"],
        "soundtrack": ["soundtrack", "movie", "film"],
        "ep": ["ep", "extended play"],
        "promo": ["promo", "promotional"],
        "bootleg": ["bootleg", "unofficial"]
    }
    
    # Check filename and title first
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in filename_lower or keyword in title_lower:
                return category
    
    # Check content
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in content_lower:
                return category
    
    return "album"  # Default category

def process_html_files(clone_dir):
    """Process all HTML files in the cloned repository."""
    html_files = []
    clone_path = Path(clone_dir)
    
    # Find all HTML files
    for html_file in clone_path.rglob("*.html"):
        if html_file.is_file():
            html_files.append(html_file)
    
    print(f"Found {len(html_files)} HTML files")
    
    albums = []
    all_images = set()
    
    for html_file in html_files:
        try:
            with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            filename = html_file.name
            
            # Skip navigation and index files
            if any(skip in filename.lower() for skip in ['index', 'navigation', 'menu', 'template']):
                continue
            
            # Extract album info
            album_info = parse_album_info(soup, filename)
            
            # Categorize the album
            text_content = extract_text_content(soup)
            album_info["category"] = categorize_album(filename, album_info["title"], text_content)
            
            # Add to albums list
            albums.append(album_info)
            
            # Collect all images
            all_images.update(album_info["images"])
            
            print(f"Processed: {filename} -> {album_info['title']} ({album_info['category']})")
            
        except Exception as e:
            print(f"Error processing {html_file}: {e}")
    
    return albums, list(all_images)

def copy_images(clone_dir, image_list):
    """Copy images from cloned repository to migration data."""
    clone_path = Path(clone_dir)
    dest_dir = Path("migration_data/extracted_content_complete/images")
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    copied_images = []
    
    for image_name in image_list:
        # Find the image in the clone directory
        image_files = list(clone_path.rglob(image_name))
        
        if image_files:
            source_file = image_files[0]  # Take the first match
            dest_file = dest_dir / image_name
            
            try:
                # Create subdirectories if needed
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_file, dest_file)
                copied_images.append(image_name)
                print(f"Copied image: {image_name}")
            except Exception as e:
                print(f"Error copying {image_name}: {e}")
        else:
            print(f"Image not found: {image_name}")
    
    return copied_images

def save_results(albums, copied_images):
    """Save extracted data to JSON files."""
    output_dir = Path("migration_data/extracted_content_complete")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save all albums
    with open(output_dir / "all_albums_complete.json", 'w', encoding='utf-8') as f:
        json.dump(albums, f, indent=2, ensure_ascii=False)
    
    # Categorize albums
    categories = {}
    for album in albums:
        category = album["category"]
        if category not in categories:
            categories[category] = []
        categories[category].append(album)
    
    # Save by category
    for category, album_list in categories.items():
        with open(output_dir / f"{category}s_complete.json", 'w', encoding='utf-8') as f:
            json.dump(album_list, f, indent=2, ensure_ascii=False)
    
    # Save image inventory
    with open(output_dir / "images_inventory_complete.json", 'w', encoding='utf-8') as f:
        json.dump({
            "total_images": len(copied_images),
            "images": copied_images
        }, f, indent=2, ensure_ascii=False)
    
    # Generate summary report
    summary = {
        "total_albums": len(albums),
        "categories": {category: len(album_list) for category, album_list in categories.items()},
        "total_images": len(copied_images),
        "extraction_date": "2025-06-20"
    }
    
    with open(output_dir / "extraction_summary.json", 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    return summary

def main():
    """Main execution function."""
    print("Starting complete repository cloning and extraction...")
    
    # Clone the repository
    clone_dir = clone_repository()
    if not clone_dir:
        print("Failed to clone repository. Exiting.")
        return
    
    # Process HTML files
    print("\nProcessing HTML files...")
    albums, image_list = process_html_files(clone_dir)
    
    # Copy images
    print(f"\nCopying {len(image_list)} images...")
    copied_images = copy_images(clone_dir, image_list)
    
    # Save results
    print("\nSaving results...")
    summary = save_results(albums, copied_images)
    
    # Print summary
    print("\n" + "="*50)
    print("EXTRACTION COMPLETE!")
    print("="*50)
    print(f"Total albums extracted: {summary['total_albums']}")
    print("Categories:")
    for category, count in summary['categories'].items():
        print(f"  {category}: {count}")
    print(f"Total images copied: {summary['total_images']}")
    print("\nFiles created:")
    print("  - migration_data/extracted_content_complete/all_albums_complete.json")
    print("  - migration_data/extracted_content_complete/albums_complete.json")
    print("  - migration_data/extracted_content_complete/singles_complete.json")
    print("  - migration_data/extracted_content_complete/images_inventory_complete.json")
    print("  - migration_data/extracted_content_complete/extraction_summary.json")
    print("  - migration_data/extracted_content_complete/images/ (copied images)")

if __name__ == "__main__":
    main()
