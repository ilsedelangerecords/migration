#!/usr/bin/env python3
"""
Clean up the extracted albums data to improve quality.
"""

import json
import re
from pathlib import Path

def clean_label(label_text):
    """Extract clean record label from messy text."""
    if not label_text:
        return ""
    
    # Look for common label patterns
    label_patterns = [
        r'Record label:\s*([^\n\r]+?)(?:\s+Released|$)',
        r'Label:\s*([^\n\r]+?)(?:\s+Released|$)',
        r'^([^0-9\n\r]+?)(?:\s+Released|\s+\d{4}|$)'
    ]
    
    for pattern in label_patterns:
        match = re.search(pattern, label_text, re.IGNORECASE)
        if match:
            label = match.group(1).strip()
            # Clean up common label names
            if any(word in label.lower() for word in ['universal', 'sony', 'emi', 'warner', 'bmg']):
                return label
    
    # Fallback: try to extract first meaningful word/phrase
    words = label_text.split()[:3]  # Take first 3 words max
    clean_words = []
    for word in words:
        if not re.search(r'\d{4}|catalog|released|number', word.lower()):
            clean_words.append(word)
        else:
            break
    
    return ' '.join(clean_words).strip()

def clean_catalog(catalog_text):
    """Extract clean catalog number from messy text."""
    if not catalog_text:
        return ""
    
    # Look for catalog number patterns
    catalog_patterns = [
        r'Catalog number:\s*([^\s\n\r]+)',
        r'Cat\.?\s*no\.?:\s*([^\s\n\r]+)',
        r'\b(\d{6}-?\d*)\b',  # 6+ digit numbers
        r'\b([A-Z]{2,}\d+)\b'  # Letters followed by numbers
    ]
    
    for pattern in catalog_patterns:
        match = re.search(pattern, catalog_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    return ""

def clean_album_data():
    """Clean up the albums data."""
    albums_file = Path("../public/content/albums.json")
    
    if not albums_file.exists():
        print("Albums file not found!")
        return
    
    with open(albums_file, 'r', encoding='utf-8') as f:
        albums = json.load(f)
    
    print(f"Cleaning {len(albums)} albums...")
    
    for album in albums:
        # Clean up label
        original_label = album.get('label', '')
        clean_label_text = clean_label(original_label)
        album['label'] = clean_label_text
        
        # Clean up catalog
        original_catalog = album.get('catalog', '')
        clean_catalog_text = clean_catalog(original_catalog)
        album['catalog'] = clean_catalog_text
        
        # Clean up title (remove redundant info)
        title = album.get('title', '')
        title = re.sub(r'\s+Information$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'^www\.ilsedelangerecords\.nl\s*[-\s]*', '', title, flags=re.IGNORECASE)
        album['title'] = title.strip()
        
        # Clean up track names
        tracks = album.get('tracks', [])
        clean_tracks = []
        for track in tracks:
            if isinstance(track, str):
                # Remove timing info and clean up
                clean_track = re.sub(r'\s*\(\d+:\d+\)$', '', track)
                clean_track = re.sub(r'\*$', '', clean_track)  # Remove asterisks
                clean_track = clean_track.strip()
                if clean_track and len(clean_track) > 2:
                    clean_tracks.append(clean_track)
        
        album['tracks'] = clean_tracks[:12]  # Limit to 12 tracks max
        
        print(f"Cleaned: {album['title']} - Label: {clean_label_text}, Catalog: {clean_catalog_text}")
    
    # Save cleaned data
    with open(albums_file, 'w', encoding='utf-8') as f:
        json.dump(albums, f, indent=2, ensure_ascii=False)
    
    print(f"Cleaned and saved {len(albums)} albums")

def main():
    """Main execution function."""
    print("Cleaning up albums data...")
    clean_album_data()
    print("Cleanup complete!")

if __name__ == "__main__":
    main()
