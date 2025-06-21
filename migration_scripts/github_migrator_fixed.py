#!/usr/bin/env python3
"""
GitHub Repository Migration Script
Fetches content from the old ilsedelangerecords website repository
"""

import json
import requests
import os
from pathlib import Path
import logging
import base64
from urllib.parse import urljoin
import mimetypes
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GitHubMigrator:
    def __init__(self, repo_url="https://api.github.com/repos/ilsedelangerecords/old_website", 
                 output_dir=None):
        self.repo_url = repo_url
        self.api_base = "https://api.github.com"
        if output_dir is None:
            current_dir = Path(__file__).parent.parent
            output_dir = current_dir / "migration_data"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Headers for GitHub API
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ilsedelange-migration-script'
        }
        
        # Track extracted files
        self.extracted_files = {
            'albums': [],
            'lyrics': [],
            'artists': [],
            'images': [],
            'other_files': []
        }
    
    def is_image_file(self, filename):
        """Check if a file is an image based on its extension"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.tiff', '.ico'}
        return Path(filename).suffix.lower() in image_extensions
    
    def is_media_file(self, filename):
        """Check if a file is a media file (image, audio, video)"""
        media_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.tiff', '.ico',  # Images
            '.mp3', '.wav', '.ogg', '.m4a', '.flac',  # Audio
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'  # Video
        }
        return Path(filename).suffix.lower() in media_extensions
    
    def fetch_binary_file(self, file_path, save_path):
        """Fetch and save a binary file from the repository"""
        try:
            file_url = f"{self.repo_url}/contents/{file_path}"
            response = requests.get(file_url, headers=self.headers)
            
            if response.status_code == 200:
                file_data = response.json()
                
                # Decode base64 content for binary files
                if file_data.get('encoding') == 'base64':
                    content = base64.b64decode(file_data['content'])
                    
                    # Ensure directory exists
                    save_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Save binary file
                    with open(save_path, 'wb') as f:
                        f.write(content)
                    
                    logger.info(f"✅ Downloaded binary file: {file_path}")
                    return True
                else:
                    logger.warning(f"⚠️ Unexpected encoding for binary file {file_path}")
                    return False
            else:
                logger.warning(f"⚠️ Could not fetch binary file {file_path}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error fetching binary file {file_path}: {e}")
            return False

    def fetch_repository_structure(self):
        """Fetch the repository structure to understand the content organization"""
        logger.info("Fetching repository structure...")
        
        try:
            # Get repository contents
            contents_url = f"{self.repo_url}/contents"
            response = requests.get(contents_url, headers=self.headers)
            
            if response.status_code == 200:
                contents = response.json()
                logger.info(f"✅ Found {len(contents)} items in repository root")
                
                # Save structure info
                structure_file = self.output_dir / "repository_structure.json"
                with open(structure_file, 'w', encoding='utf-8') as f:
                    json.dump(contents, f, indent=2, ensure_ascii=False)
                
                return contents
            else:
                logger.error(f"❌ Failed to fetch repository: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error fetching repository: {e}")
            return None

    def fetch_file_content(self, file_path):
        """Fetch content of a specific file from the repository"""
        try:
            file_url = f"{self.repo_url}/contents/{file_path}"
            response = requests.get(file_url, headers=self.headers)
            
            if response.status_code == 200:
                file_data = response.json()
                
                # Decode base64 content
                if file_data.get('encoding') == 'base64':
                    content = base64.b64decode(file_data['content']).decode('utf-8')
                    return content
                else:
                    logger.warning(f"⚠️ Unexpected encoding for {file_path}")
                    return None
            else:
                logger.warning(f"⚠️ Could not fetch {file_path}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error fetching {file_path}: {e}")
            return None

    def extract_content_from_html(self, html_content):
        """Extract structured content from HTML files"""
        content = {
            'title': '',
            'content': html_content,
            'metadata': {}
        }
        
        # Extract title from HTML
        title_match = re.search(r'<title>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
        if title_match:
            content['title'] = title_match.group(1).strip()
        
        # Extract meta description
        desc_match = re.search(r'<meta name="description" content="(.*?)"', html_content, re.IGNORECASE)
        if desc_match:
            content['metadata']['description'] = desc_match.group(1).strip()
        
        return content

    def scan_directory_recursively(self, dir_path=""):
        """Recursively scan a directory in the repository"""
        try:
            dir_url = f"{self.repo_url}/contents/{dir_path}" if dir_path else f"{self.repo_url}/contents"
            response = requests.get(dir_url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"⚠️ Could not scan directory {dir_path}: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"❌ Error scanning directory {dir_path}: {e}")
            return []

    def extract_images_from_html(self, html_content):
        """Extract image references from HTML content"""
        image_patterns = [
            r'<img[^>]+src=["\']([^"\']+)["\']',
            r'background-image:url\(["\']?([^"\']+)["\']?\)',
            r'url\(["\']?([^"\']+\.(jpg|jpeg|png|gif|svg|webp|bmp|ico))["\']?\)'
        ]
        
        image_urls = set()
        for pattern in image_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    image_url = match[0]
                else:
                    image_url = match
                
                # Clean up the URL
                image_url = image_url.strip()
                if image_url and not image_url.startswith('http'):
                    image_urls.add(image_url)
        
        return list(image_urls)

    def scan_for_all_content(self, structure=None, base_path=""):
        """Recursively scan for all content including albums, lyrics, images"""
        if structure is None:
            structure = self.fetch_repository_structure()
        
        all_files = []
        
        for item in structure:
            item_path = f"{base_path}/{item['name']}" if base_path else item['name']
            
            if item['type'] == 'file':
                all_files.append({
                    'name': item['name'],
                    'path': item_path,
                    'type': 'file',
                    'size': item.get('size', 0),
                    'download_url': item.get('download_url')
                })
                
                # Process different types of files
                name = item['name'].lower()
                
                # Check for album-related files
                if any(keyword in name for keyword in ['album', '2 original albums', 'incredible', 'next to me', 'world of hurt', 'livin on love']):
                    if name.endswith('.html'):
                        content = self.fetch_file_content(item_path)
                        if content:
                            extracted = self.extract_content_from_html(content)
                            extracted['source_file'] = item_path
                            self.extracted_files['albums'].append(extracted)
                            
                            # Extract images referenced in this HTML
                            referenced_images = self.extract_images_from_html(content)
                            for img_url in referenced_images:
                                logger.info(f"🖼️ Found image reference in {item['name']}: {img_url}")
                
                # Check for lyrics files
                elif any(keyword in name for keyword in ['lyric', 'arms of salvation', 'as if only', 'before complete surrender', 'better than that']):
                    if name.endswith('.html'):
                        content = self.fetch_file_content(item_path)
                        if content:
                            extracted = self.extract_content_from_html(content)
                            extracted['source_file'] = item_path
                            self.extracted_files['lyrics'].append(extracted)
                            
                            # Extract images referenced in this HTML
                            referenced_images = self.extract_images_from_html(content)
                            for img_url in referenced_images:
                                logger.info(f"🖼️ Found image reference in {item['name']}: {img_url}")
                
                # Check for image files
                elif self.is_image_file(name):
                    # Save image to extracted content directory
                    images_dir = self.output_dir / "extracted_content" / "images"
                    save_path = images_dir / item['name']
                    
                    if self.fetch_binary_file(item_path, save_path):
                        self.extracted_files['images'].append({
                            'name': item['name'],
                            'original_path': item_path,
                            'saved_path': str(save_path),
                            'size': item.get('size', 0)
                        })
                
                # Check for other media files
                elif self.is_media_file(name):
                    media_dir = self.output_dir / "extracted_content" / "media"
                    save_path = media_dir / item['name']
                    
                    if self.fetch_binary_file(item_path, save_path):
                        self.extracted_files['other_files'].append({
                            'name': item['name'],
                            'original_path': item_path,
                            'saved_path': str(save_path),
                            'size': item.get('size', 0)
                        })
            
            elif item['type'] == 'dir':
                # Recursively scan subdirectories
                logger.info(f"📁 Scanning directory: {item_path}")
                subdir_structure = self.scan_directory_recursively(item_path)
                if subdir_structure:
                    subdir_files = self.scan_for_all_content(subdir_structure, item_path)
                    all_files.extend(subdir_files)
        
        return all_files

    def run_migration(self):
        """Run the complete migration process"""
        logger.info("Starting comprehensive migration from GitHub repository...")
        
        # Fetch repository structure
        structure = self.fetch_repository_structure()
        if not structure:
            return False
        
        # Create content directory
        content_dir = self.output_dir / "extracted_content"
        content_dir.mkdir(exist_ok=True)
        
        # Scan for all content including images
        logger.info("🔍 Scanning repository for all content...")
        all_files = self.scan_for_all_content(structure)
        
        # Save extracted data
        if self.extracted_files['albums']:
            albums_file = content_dir / "albums.json"
            with open(albums_file, 'w', encoding='utf-8') as f:
                json.dump(self.extracted_files['albums'], f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Saved {len(self.extracted_files['albums'])} albums to {albums_file}")
        
        if self.extracted_files['lyrics']:
            lyrics_file = content_dir / "lyrics.json"
            with open(lyrics_file, 'w', encoding='utf-8') as f:
                json.dump(self.extracted_files['lyrics'], f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Saved {len(self.extracted_files['lyrics'])} lyrics to {lyrics_file}")
        
        if self.extracted_files['artists']:
            artists_file = content_dir / "artists.json"
            with open(artists_file, 'w', encoding='utf-8') as f:
                json.dump(self.extracted_files['artists'], f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Saved {len(self.extracted_files['artists'])} artists to {artists_file}")
        
        # Save images inventory
        if self.extracted_files['images']:
            images_file = content_dir / "images_inventory.json"
            with open(images_file, 'w', encoding='utf-8') as f:
                json.dump(self.extracted_files['images'], f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Saved {len(self.extracted_files['images'])} images to {images_file}")
        
        # Save other files inventory
        if self.extracted_files['other_files']:
            other_files_file = content_dir / "other_files_inventory.json"
            with open(other_files_file, 'w', encoding='utf-8') as f:
                json.dump(self.extracted_files['other_files'], f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Saved {len(self.extracted_files['other_files'])} other files to {other_files_file}")
        
        # Generate comprehensive migration report
        self.generate_migration_report()
        
        return True

    def generate_migration_report(self):
        """Generate a comprehensive migration report"""
        albums = self.extracted_files['albums']
        lyrics = self.extracted_files['lyrics']
        artists = self.extracted_files['artists']
        images = self.extracted_files['images']
        other_files = self.extracted_files['other_files']
        
        report = f"""# GitHub Migration Report

## Migration Source
- **Repository**: https://github.com/ilsedelangerecords/old_website
- **Migration Date**: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Extracted Content Summary
- **Albums**: {len(albums)} items
- **Lyrics**: {len(lyrics)} items  
- **Artists**: {len(artists)} items
- **Images**: {len(images)} files
- **Other Media**: {len(other_files)} files

## Albums Found
"""
        for album in albums:
            report += f"- {album.get('title', 'Unknown Title')} (from {album.get('source_file', 'unknown')})\n"
        
        report += "\n## Lyrics Found\n"
        for lyric in lyrics:
            report += f"- {lyric.get('title', 'Unknown Title')} (from {lyric.get('source_file', 'unknown')})\n"
        
        report += "\n## Images Downloaded\n"
        for image in images:
            report += f"- {image['name']} ({image['size']} bytes) -> {image['saved_path']}\n"
        
        report += "\n## Other Files Downloaded\n"
        for file in other_files:
            report += f"- {file['name']} ({file['size']} bytes) -> {file['saved_path']}\n"
        
        report_file = self.output_dir / "github_migration_report.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"📊 Migration report saved to {report_file}")

def main():
    migrator = GitHubMigrator()
    success = migrator.run_migration()
    
    if success:
        print("\n" + "="*50)
        print("GITHUB MIGRATION COMPLETED")
        print("="*50)
        print("✅ Repository content extracted")
        print("✅ Data saved to migration_data/")
        print("✅ Images downloaded to extracted_content/images/")
        print("✅ Report generated")
        print("="*50)
    else:
        print("\n" + "="*50)
        print("GITHUB MIGRATION FAILED")
        print("="*50)
        print("❌ Could not access repository")
        print("Please check repository URL and permissions")
        print("="*50)

if __name__ == "__main__":
    main()
