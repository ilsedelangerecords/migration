#!/usr/bin/env python3
"""
Convert the complete extracted data to frontend format and copy relevant images.
"""

import os
import json
import shutil
import re
from pathlib import Path

def clean_title(title):
    """Clean and normalize album titles."""
    if not title:
        return ""
    
    # Remove common prefixes
    title = re.sub(r'^(Ilse\s+(DeLange\s+)?|The\s+Common\s+Linnets\s+)', '', title, flags=re.IGNORECASE).strip()
    
    # Remove " single", " album", " promo" suffixes
    title = re.sub(r'\s+(single|album|promo|CD|LP)$', '', title, flags=re.IGNORECASE).strip()
    
    # Clean up extra spaces and special characters
    title = re.sub(r'\s+', ' ', title)
    title = title.replace(' - ', ' ').strip()
    
    return title

def is_main_album(item):
    """Determine if this is a main studio album."""
    title = item.get('title', '').lower()
    filename = item.get('source_file', '').lower()
    
    # Main album indicators
    main_album_keywords = [
        'world of hurt', 'here i am', 'clean up', 'incredible', 'next to me',
        'eye of the hurricane', 'the great escape', 'miracle', 'livin', 'after the hurricane',
        'dear john'
    ]
    
    # Skip certain types
    skip_keywords = [
        'single', 'promo', 'live', 'info', 'lyric', 'behind', 'interview',
        'video', 'various', 'friends for', 'tmf', 'eurovision', 'vergeten'
    ]
    
    for skip in skip_keywords:
        if skip in title or skip in filename:
            return False
    
    for album in main_album_keywords:
        if album in title or album in filename:
            return True
    
    return False

def extract_year(text):
    """Extract year from text."""
    if not text:
        return ""
    
    # Look for 4-digit years
    year_match = re.search(r'\b(19\d{2}|20\d{2})\b', str(text))
    if year_match:
        return year_match.group(1)
    
    return ""

def select_cover_image(images):
    """Select the best cover image from the list."""
    if not images:
        return ""
    
    # Prefer images with "front" or "cover" in the name
    for img in images:
        if any(keyword in img.lower() for keyword in ['front', 'cover']):
            if not any(keyword in img.lower() for keyword in ['back', 'inlay', 'booklet', 'disc']):
                return img
    
    # If no front image, take the first image
    return images[0] if images else ""

def convert_to_frontend_format():
    """Convert extracted data to frontend format."""
      # Load all extracted data
    base_path = Path("migration_data/extracted_content_complete")
    
    albums = []
    
    # Load different categories
    for category_file in ['singles_complete.json', 'lives_complete.json', 'collaborations_complete.json', 'compilations_complete.json']:
        file_path = base_path / category_file
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                category_data = json.load(f)
                albums.extend(category_data)
    
    print(f"Loaded {len(albums)} total items")
    
    # Filter for main albums and convert format
    main_albums = []
    seen_titles = set()
    
    for item in albums:
        title = clean_title(item.get('title', ''))
        
        if not title or title.lower() in seen_titles:
            continue
        
        # Check if this looks like a main album
        if is_main_album(item) or len(item.get('tracks', [])) > 8:  # Albums typically have more tracks
            cover_image = select_cover_image(item.get('images', []))
            year = extract_year(item.get('year') or item.get('description', ''))
            
            # Convert to frontend format
            album = {
                "id": len(main_albums) + 1,
                "title": title,
                "artist": "Ilse DeLange",
                "year": year,
                "coverImage": f"images/albums/{cover_image}" if cover_image else "images/placeholder.svg",
                "description": item.get('description', ''),
                "tracks": item.get('tracks', [])[:15],  # Limit to first 15 tracks
                "label": item.get('label', ''),
                "catalog": item.get('catalog', '')
            }
            
            main_albums.append(album)
            seen_titles.add(title.lower())
            
            print(f"Added album: {title} ({year}) - {len(item.get('tracks', []))} tracks")
    
    print(f"Selected {len(main_albums)} main albums")
    
    return main_albums

def copy_album_images():    """Copy selected album cover images to public/images/albums/."""
    source_dir = Path("migration_data/extracted_content_complete/images")
    dest_dir = Path("../public/images/albums")
    
    # Create destination directory
    dest_dir.mkdir(parents=True, exist_ok=True)
      # Load the albums data to see which images we need
    albums_file = Path("../public/content/albums.json")
    if albums_file.exists():
        with open(albums_file, 'r', encoding='utf-8') as f:
            albums = json.load(f)
        
        copied_count = 0
        for album in albums:
            cover_image = album.get('coverImage', '')
            if cover_image.startswith('images/albums/'):
                image_name = cover_image.replace('images/albums/', '')
                source_file = source_dir / image_name
                dest_file = dest_dir / image_name
                
                if source_file.exists() and not dest_file.exists():
                    try:
                        shutil.copy2(source_file, dest_file)
                        copied_count += 1
                        print(f"Copied: {image_name}")
                    except Exception as e:
                        print(f"Error copying {image_name}: {e}")
                        # Set placeholder if copy fails
                        album['coverImage'] = "images/placeholder.svg"
        
        # Save updated albums data
        with open(albums_file, 'w', encoding='utf-8') as f:
            json.dump(albums, f, indent=2, ensure_ascii=False)
        
        print(f"Copied {copied_count} cover images")
    
    return copied_count

def main():
    """Main execution function."""
    print("Converting extracted data to frontend format...")
    
    # Convert data
    albums = convert_to_frontend_format()
      # Save to public/content/albums.json
    output_file = Path("../public/content/albums.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(albums, f, indent=2, ensure_ascii=False)
    
    print(f"Saved {len(albums)} albums to {output_file}")
    
    # Copy images
    print("Copying album cover images...")
    copied_count = copy_album_images()
    
    print(f"\\nConversion complete!")
    print(f"- {len(albums)} albums saved to public/content/albums.json")
    print(f"- {copied_count} cover images copied to public/images/albums/")

if __name__ == "__main__":
    main()
