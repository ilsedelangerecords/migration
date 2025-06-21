#!/usr/bin/env python3
"""
Content Converter Script
Converts the migrated HTML content to structured JSON format expected by the new website.
"""

import json
import re
import os
from bs4 import BeautifulSoup
from pathlib import Path

def extract_title_from_html(html_content):
    """Extract title from HTML content"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Try to get title from <title> tag
    title_tag = soup.find('title')
    if title_tag:
        title = title_tag.get_text().strip()
        # Clean up common patterns
        title = re.sub(r'^Ilse\s+(?:DeLange|delange)\s*-?\s*', '', title, flags=re.IGNORECASE)
        return title
    
    # Try to get from meta description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc and meta_desc.get('content'):
        desc = meta_desc.get('content').strip()
        # Extract title from description
        if '-' in desc:
            return desc.split('-')[0].strip()
        return desc
    
    return "Unknown Title"

def extract_description_from_html(html_content):
    """Extract description from HTML content"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Try to get from meta description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc and meta_desc.get('content'):
        return meta_desc.get('content').strip()
    
    # Try to extract from main content areas
    text_elements = soup.find_all(['p', 'div'], class_=['Normal', 'C-3'])
    descriptions = []
    for elem in text_elements:
        text = elem.get_text().strip()
        if text and len(text) > 20 and not text.startswith('0'):  # Skip track listings
            descriptions.append(text)
    
    if descriptions:
        return ' '.join(descriptions[:2])  # First couple of descriptions
    
    return "Classic album from Ilse DeLange's discography"

def extract_year_from_html(html_content):
    """Extract release year from HTML content"""
    # Look for year patterns in the HTML
    year_patterns = [
        r'Released:\s*(?:\w+\s+)?(\d{4})',
        r'(\d{4})',
        r'released\s+(\d{4})',
    ]
    
    for pattern in year_patterns:
        matches = re.findall(pattern, html_content, re.IGNORECASE)
        for match in matches:
            year = int(match)
            if 1990 <= year <= 2025:  # Reasonable year range
                return year
    
    return None

def extract_record_label_from_html(html_content):
    """Extract record label from HTML content"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Look for record label patterns
    label_patterns = [
        r'Record\s+label:\s*([^&\n]+)',
        r'Label:\s*([^&\n]+)',
    ]
    
    for pattern in label_patterns:
        matches = re.findall(pattern, html_content, re.IGNORECASE)
        if matches:
            return matches[0].strip()
    
    return "Unknown Label"

def extract_tracks_from_html(html_content):
    """Extract track listing from HTML content"""
    soup = BeautifulSoup(html_content, 'html.parser')
    tracks = []
    
    # Look for track patterns
    track_patterns = [
        r'(\d{2}):\s*([^(]+)\s*\(([^)]+)\)',  # "01: Song Title (3:45)"
        r'(\d{1,2})\.\s*([^(]+)\s*\(([^)]+)\)',  # "1. Song Title (3:45)"
    ]
    
    for pattern in track_patterns:
        matches = re.findall(pattern, html_content)
        for match in matches:
            track_num, title, duration = match
            tracks.append({
                "number": int(track_num),
                "title": title.strip(),
                "duration": duration.strip(),
                "hasLyrics": False
            })
    
    return tracks

def find_album_image(title, images_dir):
    """Find corresponding album image for the title"""
    # Clean title for filename matching
    clean_title = re.sub(r'[^a-zA-Z0-9\s]', '', title.lower())
    clean_title = re.sub(r'\s+', '-', clean_title.strip())
    
    # Common image patterns
    patterns = [
        f"{clean_title}-cover.jpg",
        f"{clean_title}-front.jpg",
        f"{clean_title}.jpg",
        f"{title.lower().replace(' ', '-')}-cover.jpg",
    ]
    
    # Check if any pattern matches existing files
    for pattern in patterns:
        image_path = images_dir / pattern
        if image_path.exists():
            return f"/images/albums/{pattern}"
    
    # Look for partial matches in existing files
    for img_file in images_dir.glob("*.jpg"):
        if any(word in img_file.stem.lower() for word in clean_title.split('-') if len(word) > 3):
            return f"/images/albums/{img_file.name}"
    
    return "/images/placeholder.svg"

def determine_album_type(title, description):
    """Determine album type based on title and description"""
    title_lower = title.lower()
    desc_lower = description.lower()
    
    if any(word in title_lower for word in ['live', 'concert', 'tour']):
        return "live"
    elif any(word in title_lower for word in ['compilation', 'collection', 'hits', 'best']):
        return "compilation"
    elif any(word in title_lower for word in ['ep', 'single']):
        return "single"
    else:
        return "studio"

def generate_slug(title):
    """Generate URL-friendly slug from title"""
    slug = re.sub(r'[^a-zA-Z0-9\s]', '', title.lower())
    slug = re.sub(r'\s+', '-', slug.strip())
    return slug

def convert_albums(input_file, output_file, images_dir):
    """Convert migrated albums data to structured format"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        migrated_data = json.load(f)
    
    converted_albums = []
    album_id = 1
    
    for item in migrated_data:
        title = extract_title_from_html(item['content'])
        
        # Skip if this looks like a navigation or system file
        if any(skip_word in title.lower() for skip_word in ['menu', 'nav', 'home', 'index']):
            continue
        
        description = extract_description_from_html(item['content'])
        year = extract_year_from_html(item['content'])
        record_label = extract_record_label_from_html(item['content'])
        tracks = extract_tracks_from_html(item['content'])
        album_type = determine_album_type(title, description)
        slug = generate_slug(title)
        cover_art = find_album_image(title, images_dir)
        
        album = {
            "id": str(album_id),
            "title": title,
            "slug": slug,
            "artist": "Ilse DeLange",
            "artistId": "ilse-delange",
            "year": year or 2000,
            "type": album_type,
            "releaseDate": f"{year or 2000}-01-01",
            "recordLabel": record_label,
            "catalogNumber": f"IL{album_id:03d}",
            "description": description,
            "coverArt": cover_art,
            "trackCount": len(tracks),
            "duration": "45:00",  # Default duration
            "chartPerformance": [],
            "productionCredits": [],
            "tracks": tracks,
            "migrated": True,
            "sourceFile": item.get('source_file', 'unknown.html')
        }
        
        converted_albums.append(album)
        album_id += 1
    
    # Write converted data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(converted_albums, f, indent=2, ensure_ascii=False)
    
    print(f"Converted {len(converted_albums)} albums to {output_file}")
    
    return converted_albums

def main():
    """Main conversion function"""
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    migration_dir = project_root / "migration_data" / "extracted_content"
    public_dir = project_root / "public"
    images_dir = public_dir / "images" / "albums"
    
    # Input and output files
    input_albums = migration_dir / "albums.json"
    output_albums = public_dir / "content" / "albums_migrated.json"
    
    # Ensure output directory exists
    output_albums.parent.mkdir(parents=True, exist_ok=True)
    
    # Convert albums
    if input_albums.exists():
        converted_albums = convert_albums(input_albums, output_albums, images_dir)
        
        # Also create a backup of the current albums.json
        current_albums = public_dir / "content" / "albums.json"
        if current_albums.exists():
            backup_albums = public_dir / "content" / "albums_original.json"
            import shutil
            shutil.copy2(current_albums, backup_albums)
            print(f"Backed up current albums.json to {backup_albums}")
        
        # Create a summary report
        summary = {
            "conversion_summary": {
                "total_albums_converted": len(converted_albums),
                "albums_with_tracks": len([a for a in converted_albums if a['tracks']]),
                "albums_with_images": len([a for a in converted_albums if not a['coverArt'].endswith('placeholder.svg')]),
                "albums_with_years": len([a for a in converted_albums if a['year'] and a['year'] != 2000]),
            },
            "converted_albums": [
                {
                    "title": album['title'],
                    "year": album['year'],
                    "type": album['type'],
                    "track_count": album['trackCount'],
                    "has_image": not album['coverArt'].endswith('placeholder.svg'),
                    "source_file": album['sourceFile']
                }
                for album in converted_albums
            ]
        }
        
        summary_file = migration_dir / "conversion_summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"Created conversion summary at {summary_file}")
        print(f"Summary: {summary['conversion_summary']}")
    else:
        print(f"Input file not found: {input_albums}")

if __name__ == "__main__":
    main()
