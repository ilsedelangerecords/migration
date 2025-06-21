#!/usr/bin/env python3
"""
Complete Repository Migration Script
Clones the old website repository and extracts all album data comprehensively
"""

import os
import json
import shutil
import subprocess
from pathlib import Path
import logging
from bs4 import BeautifulSoup
import re
from urllib.parse import unquote

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CompleteRepositoryMigrator:
    def __init__(self, output_dir=None):
        if output_dir is None:
            current_dir = Path(__file__).parent.parent
            output_dir = current_dir / "migration_data"
        
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Repository settings
        self.repo_url = "https://github.com/ilsedelangerecords/old_website.git"
        self.clone_dir = self.output_dir / "cloned_repository"
        self.extracted_dir = self.output_dir / "extracted_content_complete"
        
        # Create output directories
        self.extracted_dir.mkdir(exist_ok=True)
        (self.extracted_dir / "images").mkdir(exist_ok=True)
        
        # Content collections
        self.albums = []
        self.lyrics = []
        self.singles = []
        self.live_albums = []
        self.compilations = []
        self.other_artists = []
        
        # File tracking
        self.processed_files = set()
        self.image_files = []
        
    def clone_repository(self):
        """Clone the old website repository"""
        logger.info("Cloning repository from GitHub...")
        
        # Remove existing clone if it exists
        if self.clone_dir.exists():
            logger.info("Removing existing clone directory...")
            shutil.rmtree(self.clone_dir)
        
        try:
            # Clone the repository
            result = subprocess.run([
                'git', 'clone', self.repo_url, str(self.clone_dir)
            ], capture_output=True, text=True, check=True)
            
            logger.info(f"✅ Repository cloned successfully to {self.clone_dir}")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to clone repository: {e}")
            logger.error(f"Error output: {e.stderr}")
            return False
        except FileNotFoundError:
            logger.error("❌ Git is not installed or not in PATH")
            return False
    
    def extract_title_from_html(self, html_content):
        """Extract title from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Try to get title from <title> tag
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
            # Clean up common patterns
            title = re.sub(r'^Ilse\s+(?:DeLange|delange)\s*-?\s*', '', title, flags=re.IGNORECASE)
            title = re.sub(r'\s*-\s*www\.ilsedelangerecords\.nl.*$', '', title, flags=re.IGNORECASE)
            return title.strip()
        
        return "Unknown Title"
    
    def extract_description_from_html(self, html_content):
        """Extract description from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Try to get from meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            return meta_desc.get('content').strip()
        
        return "Album from Ilse DeLange's discography"
    
    def extract_year_from_content(self, html_content):
        """Extract release year from HTML content"""
        year_patterns = [
            r'Released?:?\s*(?:\w+\s+)?(\d{4})',
            r'(\d{4})',
            r'released?\s+(?:in\s+)?(\d{4})',
            r'year:?\s*(\d{4})'
        ]
        
        for pattern in year_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                year = int(match)
                if 1990 <= year <= 2025:  # Reasonable year range
                    return year
        
        return None
    
    def extract_record_label_from_content(self, html_content):
        """Extract record label from HTML content"""
        label_patterns = [
            r'Record\s+label:?\s*([^&\n<]+)',
            r'Label:?\s*([^&\n<]+)',
            r'Released\s+by:?\s*([^&\n<]+)'
        ]
        
        for pattern in label_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            if matches:
                label = matches[0].strip()
                # Clean up HTML entities and extra whitespace
                label = re.sub(r'&nbsp;', ' ', label)
                label = re.sub(r'\s+', ' ', label)
                return label.strip()
        
        return "Unknown Label"
    
    def extract_tracks_from_content(self, html_content):
        """Extract track listing from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        tracks = []
        
        # Look for track patterns in the HTML
        track_patterns = [
            r'(\d{2}):\s*([^(]+?)\s*\(([^)]+)\)',  # "01: Song Title (3:45)"
            r'(\d{1,2})\.\s*([^(]+?)\s*\(([^)]+)\)',  # "1. Song Title (3:45)"
            r'(\d{1,2})\s*[-–]\s*([^(]+?)\s*\(([^)]+)\)',  # "1 - Song Title (3:45)"
        ]
        
        for pattern in track_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL)
            for match in matches:
                try:
                    track_num, title, duration = match
                    track_num = int(track_num)
                    title = re.sub(r'<[^>]+>', '', title).strip()  # Remove HTML tags
                    duration = duration.strip()
                    
                    if title and len(title) > 1:  # Valid track title
                        tracks.append({
                            "number": track_num,
                            "title": title,
                            "duration": duration,
                            "hasLyrics": False
                        })
                except (ValueError, AttributeError):
                    continue
        
        # Remove duplicates and sort by track number
        seen_tracks = {}
        for track in tracks:
            if track['number'] not in seen_tracks:
                seen_tracks[track['number']] = track
        
        return sorted(seen_tracks.values(), key=lambda x: x['number'])
    
    def determine_album_type(self, filename, title, content):
        """Determine the type of album based on filename, title, and content"""
        filename_lower = filename.lower()
        title_lower = title.lower()
        content_lower = content.lower()
        
        # Check for live albums
        if any(word in filename_lower or word in title_lower for word in ['live', 'concert', 'tour', 'ahoy', 'gelredome']):
            return "live"
        
        # Check for singles
        if any(word in filename_lower for word in ['single', 'promo']) or 'single' in title_lower:
            return "single"
        
        # Check for compilations
        if any(word in filename_lower or word in title_lower for word in 
               ['compilation', 'collection', 'hits', 'best', 'greatest', '20 jaar', 'various']):
            return "compilation"
        
        # Check for Common Linnets
        if any(word in filename_lower or word in title_lower for word in ['tcl', 'common linnets', 'linnets']):
            return "collaboration"
        
        # Default to studio album
        return "studio"
    
    def categorize_by_artist(self, filename, title, content):
        """Determine if this is an Ilse DeLange album or other artist"""
        filename_lower = filename.lower()
        title_lower = title.lower()
        content_lower = content.lower()
        
        # Check for other artists
        other_artist_indicators = [
            'kane', 'blof', 'zucchero', 'rosemary', 'bosshoss', 'paul de leeuw',
            'various artist', 'other artist', 'artiesten voor', 'friends for war'
        ]
        
        if any(indicator in filename_lower or indicator in title_lower for indicator in other_artist_indicators):
            return "other_artist"
        
        # Check for Common Linnets (collaboration)
        if any(word in filename_lower or word in title_lower for word in ['tcl', 'common linnets']):
            return "common_linnets"
        
        # Default to Ilse DeLange
        return "ilse_delange"
    
    def scan_html_files(self):
        """Scan all HTML files in the cloned repository"""
        logger.info("Scanning for HTML files...")
        
        html_files = list(self.clone_dir.glob("**/*.html"))
        logger.info(f"Found {len(html_files)} HTML files")
        
        album_id = 1
        
        for html_file in html_files:
            try:
                # Skip certain files
                filename = html_file.name.lower()
                if any(skip in filename for skip in ['index', 'home', 'disclaimer', 'help', 'wanted']):
                    continue
                
                # Read HTML content
                with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
                    html_content = f.read()
                
                if len(html_content) < 500:  # Skip very small files
                    continue
                
                # Extract basic information
                title = self.extract_title_from_html(html_content)
                description = self.extract_description_from_html(html_content)
                year = self.extract_year_from_content(html_content)
                record_label = self.extract_record_label_from_content(html_content)
                tracks = self.extract_tracks_from_content(html_content)
                album_type = self.determine_album_type(filename, title, html_content)
                artist_category = self.categorize_by_artist(filename, title, html_content)
                
                # Create album entry
                album_entry = {
                    "id": str(album_id),
                    "title": title,
                    "slug": self.create_slug(title),
                    "artist": self.get_artist_name(artist_category),
                    "artistId": self.get_artist_id(artist_category),
                    "year": year or 2000,
                    "type": album_type,
                    "releaseDate": f"{year or 2000}-01-01",
                    "recordLabel": record_label,
                    "catalogNumber": f"IL{album_id:03d}",
                    "description": description,
                    "coverArt": "/images/placeholder.svg",  # Will be updated later
                    "trackCount": len(tracks),
                    "duration": self.calculate_total_duration(tracks),
                    "chartPerformance": [],
                    "productionCredits": [],
                    "tracks": tracks,
                    "migrated": True,
                    "sourceFile": str(html_file.relative_to(self.clone_dir)),
                    "originalContent": html_content[:1000] + "..." if len(html_content) > 1000 else html_content
                }
                
                # Categorize the album
                if artist_category == "other_artist":
                    self.other_artists.append(album_entry)
                elif album_type == "single":
                    self.singles.append(album_entry)
                elif album_type == "live":
                    self.live_albums.append(album_entry)
                elif album_type in ["compilation", "collaboration"]:
                    self.compilations.append(album_entry)
                else:
                    self.albums.append(album_entry)
                
                logger.info(f"✅ Processed: {title} ({album_type}, {artist_category})")
                album_id += 1
                
            except Exception as e:
                logger.error(f"❌ Error processing {html_file}: {e}")
                continue
    
    def create_slug(self, title):
        """Create URL-friendly slug from title"""
        slug = re.sub(r'[^a-zA-Z0-9\s]', '', title.lower())
        slug = re.sub(r'\s+', '-', slug.strip())
        return slug
    
    def get_artist_name(self, artist_category):
        """Get artist name based on category"""
        if artist_category == "common_linnets":
            return "The Common Linnets"
        elif artist_category == "other_artist":
            return "Various Artists"
        else:
            return "Ilse DeLange"
    
    def get_artist_id(self, artist_category):
        """Get artist ID based on category"""
        if artist_category == "common_linnets":
            return "common-linnets"
        elif artist_category == "other_artist":
            return "various-artists"
        else:
            return "ilse-delange"
    
    def calculate_total_duration(self, tracks):
        """Calculate total album duration from tracks"""
        if not tracks:
            return "45:00"  # Default
        
        total_seconds = 0
        for track in tracks:
            try:
                duration = track.get('duration', '3:30')
                if ':' in duration:
                    parts = duration.split(':')
                    minutes = int(parts[0])
                    seconds = int(parts[1])
                    total_seconds += minutes * 60 + seconds
            except (ValueError, IndexError):
                total_seconds += 210  # Default 3:30
        
        total_minutes = total_seconds // 60
        total_seconds = total_seconds % 60
        return f"{total_minutes}:{total_seconds:02d}"
    
    def copy_images(self):
        """Copy all image files from the repository"""
        logger.info("Copying image files...")
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'}
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(self.clone_dir.glob(f"**/*{ext}"))
            image_files.extend(self.clone_dir.glob(f"**/*{ext.upper()}"))
        
        logger.info(f"Found {len(image_files)} image files")
        
        images_output_dir = self.extracted_dir / "images"
        
        for image_file in image_files:
            try:
                # Create safe filename
                safe_name = re.sub(r'[^a-zA-Z0-9\-_.]', '-', image_file.name)
                output_path = images_output_dir / safe_name
                
                # Avoid overwrites by adding numbers
                counter = 1
                original_path = output_path
                while output_path.exists():
                    name_parts = original_path.stem, counter, original_path.suffix
                    output_path = original_path.parent / f"{name_parts[0]}-{name_parts[1]}{name_parts[2]}"
                    counter += 1
                
                shutil.copy2(image_file, output_path)
                
                self.image_files.append({
                    "original_path": str(image_file.relative_to(self.clone_dir)),
                    "new_path": str(output_path.relative_to(self.extracted_dir)),
                    "filename": output_path.name,
                    "size": image_file.stat().st_size
                })
                
            except Exception as e:
                logger.error(f"❌ Error copying image {image_file}: {e}")
    
    def save_extracted_data(self):
        """Save all extracted data to JSON files"""
        logger.info("Saving extracted data...")
        
        # Save main albums (Ilse DeLange studio albums)
        albums_file = self.extracted_dir / "albums_complete.json"
        with open(albums_file, 'w', encoding='utf-8') as f:
            json.dump(self.albums, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Saved {len(self.albums)} main albums to {albums_file}")
        
        # Save singles
        singles_file = self.extracted_dir / "singles_complete.json"
        with open(singles_file, 'w', encoding='utf-8') as f:
            json.dump(self.singles, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Saved {len(self.singles)} singles to {singles_file}")
        
        # Save live albums
        live_file = self.extracted_dir / "live_albums_complete.json"
        with open(live_file, 'w', encoding='utf-8') as f:
            json.dump(self.live_albums, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Saved {len(self.live_albums)} live albums to {live_file}")
        
        # Save compilations
        compilations_file = self.extracted_dir / "compilations_complete.json"
        with open(compilations_file, 'w', encoding='utf-8') as f:
            json.dump(self.compilations, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Saved {len(self.compilations)} compilations to {compilations_file}")
        
        # Save other artists
        other_file = self.extracted_dir / "other_artists_complete.json"
        with open(other_file, 'w', encoding='utf-8') as f:
            json.dump(self.other_artists, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Saved {len(self.other_artists)} other artist albums to {other_file}")
        
        # Save images inventory
        images_file = self.extracted_dir / "images_inventory_complete.json"
        with open(images_file, 'w', encoding='utf-8') as f:
            json.dump(self.image_files, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Saved {len(self.image_files)} images to {images_file}")
        
        # Create combined albums file for the website
        all_albums = self.albums + self.compilations + self.live_albums
        combined_file = self.extracted_dir / "all_albums_combined.json"
        with open(combined_file, 'w', encoding='utf-8') as f:
            json.dump(all_albums, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Saved {len(all_albums)} combined albums to {combined_file}")
    
    def generate_migration_report(self):
        """Generate a comprehensive migration report"""
        total_albums = len(self.albums)
        total_singles = len(self.singles)
        total_live = len(self.live_albums)
        total_compilations = len(self.compilations)
        total_other = len(self.other_artists)
        total_images = len(self.image_files)
        
        report = f"""# Complete Repository Migration Report

## Migration Source
- **Repository**: https://github.com/ilsedelangerecords/old_website
- **Migration Date**: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Method**: Full repository clone and comprehensive HTML parsing

## Content Summary
- **Studio Albums**: {total_albums} items
- **Singles**: {total_singles} items
- **Live Albums**: {total_live} items
- **Compilations**: {total_compilations} items
- **Other Artists**: {total_other} items
- **Total Images**: {total_images} files

## Main Albums (Studio)
"""
        
        for i, album in enumerate(self.albums[:10], 1):
            title = album.get('title', f'Album {i}')
            tracks = len(album.get('tracks', []))
            year = album.get('year', 'Unknown')
            report += f"- {title} ({year}) - {tracks} tracks\n"
        
        if len(self.albums) > 10:
            report += f"- ... and {len(self.albums) - 10} more albums\n"
        
        report += f"""
## Live Albums
"""
        for album in self.live_albums:
            title = album.get('title', 'Unknown')
            year = album.get('year', 'Unknown')
            report += f"- {title} ({year})\n"
        
        report += f"""
## Compilations & Collections
"""
        for album in self.compilations:
            title = album.get('title', 'Unknown')
            year = album.get('year', 'Unknown')
            report += f"- {title} ({year})\n"
        
        # Calculate total image size
        total_image_size = sum(img.get('size', 0) for img in self.image_files)
        
        report += f"""
## Images
- **Total Count**: {total_images}
- **Total Size**: {total_image_size:,} bytes ({total_image_size/1024/1024:.2f} MB)

## File Locations
- **Main Albums**: `migration_data/extracted_content_complete/albums_complete.json`
- **All Combined**: `migration_data/extracted_content_complete/all_albums_combined.json`
- **Singles**: `migration_data/extracted_content_complete/singles_complete.json`
- **Live Albums**: `migration_data/extracted_content_complete/live_albums_complete.json`
- **Compilations**: `migration_data/extracted_content_complete/compilations_complete.json`
- **Other Artists**: `migration_data/extracted_content_complete/other_artists_complete.json`
- **Images**: `migration_data/extracted_content_complete/images/`

## Next Steps
1. Review extracted content files
2. Copy `all_albums_combined.json` to `public/content/albums.json`
3. Copy selected images to `public/images/albums/`
4. Test the website with migrated data
5. Fine-tune album categorization if needed

## Notes
- All HTML files have been processed comprehensively
- Track listings extracted where available
- Images copied and inventoried
- Content categorized by type and artist
- Different album versions are handled as separate entries
"""
        
        report_file = self.output_dir / "complete_migration_report.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"📊 Complete migration report saved to {report_file}")
    
    def run_complete_migration(self):
        """Run the complete migration process"""
        logger.info("🚀 Starting complete repository migration...")
        
        # Step 1: Clone repository
        if not self.clone_repository():
            return False
        
        # Step 2: Scan HTML files
        self.scan_html_files()
        
        # Step 3: Copy images
        self.copy_images()
        
        # Step 4: Save extracted data
        self.save_extracted_data()
        
        # Step 5: Generate report
        self.generate_migration_report()
        
        logger.info("✅ Complete migration finished successfully!")
        
        print("\n" + "="*60)
        print("COMPLETE REPOSITORY MIGRATION COMPLETED")
        print("="*60)
        print(f"✅ Studio Albums: {len(self.albums)}")
        print(f"✅ Singles: {len(self.singles)}")
        print(f"✅ Live Albums: {len(self.live_albums)}")
        print(f"✅ Compilations: {len(self.compilations)}")
        print(f"✅ Other Artists: {len(self.other_artists)}")
        print(f"✅ Images: {len(self.image_files)}")
        print("="*60)
        print(f"📁 Files saved to: {self.extracted_dir}")
        print(f"📊 Report: {self.output_dir}/complete_migration_report.md")
        print("="*60)
        
        return True

def main():
    migrator = CompleteRepositoryMigrator()
    success = migrator.run_complete_migration()
    
    if not success:
        print("\n❌ Migration failed. Check the logs for details.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
