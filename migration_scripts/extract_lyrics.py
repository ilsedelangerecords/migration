#!/usr/bin/env python3
"""
Extracts lyrics from HTML files, preserving formatting.
"""

import os
import json
from pathlib import Path
from bs4 import BeautifulSoup
import re
from urllib.parse import unquote

def extract_lyrics_content(soup):
    """Extract clean text content from HTML, preserving line breaks."""
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.decompose()
    
    # Get text and clean it up, preserving line breaks
    text = soup.get_text(separator='\n')
    lines = (line.strip() for line in text.splitlines())
    return '\n'.join(line for line in lines if line)

def main():
    """Main function to extract lyrics."""
    clone_dir = "migration_data/old_website_clone"
    if not os.path.exists(clone_dir):
        print(f"Cloned repository not found at: {clone_dir}")
        return

    songs = [
        {"title": "Arms of salvation", "filename": "Arms of salvation lyrics.html", "artist": "The Common Linnets"},
        {"title": "As if only", "filename": "As if only lyrics.html", "artist": "The Common Linnets"},
        {"title": "Before complete surrender", "filename": "Before complete surrender lyrics.html", "artist": "The Common Linnets"},
        {"title": "Better than that", "filename": "Better than that, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Broken but Home", "filename": "Broken but Home, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Calm after the storm", "filename": "Calm after the storm, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Christmas around me", "filename": "Christmas around me, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Days of endless time", "filename": "Days of endless time, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Dust of Oklahoma", "filename": "Dust of Oklahoma, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Give me a reason", "filename": "Give me a reason, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Hearts on fire", "filename": "Hearts on fire, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Hungry hands", "filename": "Hungry hands, lyrics.html", "artist": "The Common Linnets"},
        {"title": "I like it like that", "filename": "I like it like that, lyrics.html", "artist": "The Common Linnets"},
        {"title": "In your eyes", "filename": "In your eyes, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Indigo moon", "filename": "Indigo moon, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Jolene", "filename": "Jolene, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Kalverliefde", "filename": "Kalverliefde, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Love goes on", "filename": "Love goes on, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Lovers & Liars", "filename": "Lovers & Liars, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Proud", "filename": "Proud, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Runaway man", "filename": "Runaway man, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Soho waltz", "filename": "Soho waltz, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Still loving after you", "filename": "Still loving after you, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Sun Song", "filename": "Sun Song, lyrics.html", "artist": "The Common Linnets"},
        {"title": "That part", "filename": "That part, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Time has no mercy", "filename": "Time has no mercy, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Walls of Jericho", "filename": "Walls of Jericho, lyrics.html", "artist": "The Common Linnets"},
        {"title": "We don’t make the wind blow", "filename": "We don't make the wind blow, lyrics.html", "artist": "The Common Linnets"},
        {"title": "When love was king", "filename": "When love was king, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Where do I go with me", "filename": "Where do i go with me, lyrics.html", "artist": "The Common Linnets"},
        {"title": "Adrift", "filename": "Adrift.html", "artist": "Ilse DeLange"},
        {"title": "All alone", "filename": "All alone.html", "artist": "Ilse DeLange"},
        {"title": "All I got to give", "filename": "All i got to give.html", "artist": "Ilse DeLange"},
        {"title": "All of the women you’ll ever need", "filename": "All of the woman you'll ever need.html", "artist": "Ilse DeLange"},
        {"title": "All that you do", "filename": "All that you do.html", "artist": "Ilse DeLange"},
        {"title": "All the answers", "filename": "All the answers.html", "artist": "Ilse DeLange"},
        {"title": "Almost", "filename": "Almost.html", "artist": "Ilse DeLange"},
        {"title": "Als je iets kan doen", "filename": "Als je iets kan doen.html", "artist": "Ilse DeLange"},
        {"title": "Always overcome", "filename": "Always overcome.html", "artist": "Ilse DeLange"},
        {"title": "Angel eyes", "filename": "Angel eyes.html", "artist": "Ilse DeLange"},
        {"title": "Around again", "filename": "araound again.html", "artist": "Ilse DeLange"},
        {"title": "Back of my mind", "filename": "Back of my mind.html", "artist": "Ilse DeLange"},
        {"title": "Beautiful distraction", "filename": "Beatiful distraction.html", "artist": "Ilse DeLange"},
        {"title": "Before you let me go", "filename": "Before you let me go.html", "artist": "Ilse DeLange"},
        {"title": "Better then rain", "filename": "Better then rain.html", "artist": "Ilse DeLange"},
        {"title": "Beyond gravity", "filename": "Beyond gravity.html", "artist": "Ilse DeLange"},
        {"title": "Blue bittersweet", "filename": "Blue bittersweet.html", "artist": "Ilse DeLange"},
        {"title": "Blue", "filename": "Blue.html", "artist": "Ilse DeLange"},
        {"title": "Breathe in, breathe out", "filename": "Breathe in, breathe out.html", "artist": "Ilse DeLange"},
        {"title": "Breathin’", "filename": "Breathin'.html", "artist": "Ilse DeLange"},
        {"title": "Broken girl", "filename": "Broken girl.html", "artist": "Ilse DeLange"},
        {"title": "But beautiful", "filename": "But beautiful.html", "artist": "Ilse DeLange"},
        {"title": "Carousel", "filename": "Carousel lyricks.html", "artist": "Ilse DeLange"},
        {"title": "Carry hope", "filename": "Carry hope.html", "artist": "Ilse DeLange"},
        {"title": "Child of the wild blue yonder", "filename": "Child of the wild blue yonder.html", "artist": "Ilse DeLange"},
        {"title": "Clean up", "filename": "Clean up lyric.html", "artist": "Ilse DeLange"},
        {"title": "Dance on the heartbreak", "filename": "Dance on the heartbreak.html", "artist": "Ilse DeLange"},
        {"title": "Déjà Vu", "filename": "Déjà Vu.html", "artist": "Ilse DeLange"},
        {"title": "De oorlog meegemaakt", "filename": "De oorlog meegemaakt.html", "artist": "Ilse DeLange"},
        {"title": "Doluv2luvu", "filename": "Doluv2luvu.html", "artist": "Ilse DeLange"},
        {"title": "Don’t you let go of me", "filename": "Don't you let go of me.html", "artist": "Ilse DeLange"},
        {"title": "Engel van m’n hart", "filename": "Engel van m’n hart.html", "artist": "Ilse DeLange"},
        {"title": "Everywhere I go", "filename": "Everywhere I go.html", "artist": "Ilse DeLange"},
        {"title": "Eyes straight ahead", "filename": "Eyes straight ahead.html", "artist": "Ilse DeLange"},
        {"title": "Fall", "filename": "Fall.html", "artist": "Ilse DeLange"},
        {"title": "Far away", "filename": "Far away.html", "artist": "Ilse DeLange"},
        {"title": "Feels like rain", "filename": "Feels like rain.html", "artist": "Ilse DeLange"},
        {"title": "Flying blind", "filename": "Flying blind.html", "artist": "Ilse DeLange"},
        {"title": "Flying solo", "filename": "Flying solo.html", "artist": "Ilse DeLange"},
        {"title": "Fold this world", "filename": "Fold this world.html", "artist": "Ilse DeLange"},
        {"title": "Follow", "filename": "Follow.html", "artist": "Ilse DeLange"},
        {"title": "Good thing", "filename": "Good thing.html", "artist": "Ilse DeLange"},
        {"title": "Have a little faith in me", "filename": "Have a little faith in me.html", "artist": "Ilse DeLange"},
        {"title": "Heartbeat", "filename": "heartbeat lyrics.html", "artist": "Ilse DeLange"},
        {"title": "Heavenless", "filename": "Heavenless.html", "artist": "Ilse DeLange"},
        {"title": "Here I am", "filename": "Here I am.html", "artist": "Ilse DeLange"},
        {"title": "High places", "filename": "high places.html", "artist": "Ilse DeLange"},
        {"title": "Hurricane", "filename": "Hurricane.html", "artist": "Ilse DeLange"},
        {"title": "I almost believed", "filename": "I almost believed.html", "artist": "Ilse DeLange"},
        {"title": "I always will", "filename": "I always will.html", "artist": "Ilse DeLange"},
        {"title": "I love you", "filename": "I love you.html", "artist": "Ilse DeLange"},
        {"title": "I need for you", "filename": "I need for you.html", "artist": "Ilse DeLange"},
        {"title": "I still cry", "filename": "I still cry.html", "artist": "Ilse DeLange"},
        {"title": "I’d be yours", "filename": "I'd be yours.html", "artist": "Ilse DeLange"},
        {"title": "Iedereen is van de wereld", "filename": "Iedereen is van de wereld.html", "artist": "Ilse DeLange"},
        {"title": "If you had the heart", "filename": "If you had the heart.html", "artist": "Ilse DeLange"},
        {"title": "I'll know", "filename": "I'll know.html", "artist": "Ilse DeLange"},
        {"title": "I’m not so tough", "filename": "I'm not so tough.html", "artist": "Ilse DeLange"},
        {"title": "Inside job", "filename": "Inside job.html", "artist": "Ilse DeLange"},
        {"title": "It'll come to you", "filename": "It'll come to you.html", "artist": "Ilse DeLange"},
        {"title": "Just kids", "filename": "Just kids.html", "artist": "Ilse DeLange"},
        {"title": "Just like the moon", "filename": "just like the moon.html", "artist": "Ilse DeLange"},
        {"title": "Lay Your Weapons Down", "filename": "Lay Your Weapons Down.html", "artist": "Ilse DeLange"},
        {"title": "Learning to swim", "filename": "Learning to swim.html", "artist": "Ilse DeLange"},
        {"title": "Let go", "filename": "Let go.html", "artist": "Ilse DeLange"},
        {"title": "Livin' on love", "filename": "Livin' on love.html", "artist": "Ilse DeLange"},
        {"title": "Lonely too", "filename": "Lonely too.html", "artist": "Ilse DeLange"},
        {"title": "Love won't hide", "filename": "Love won't hide.html", "artist": "Ilse DeLange"},
        {"title": "Machine people", "filename": "Machine people.html", "artist": "Ilse DeLange"},
        {"title": "Magic", "filename": "Magic.html", "artist": "Ilse DeLange"},
        {"title": "Man in the moon", "filename": "Man in the moon.html", "artist": "Ilse DeLange"},
        {"title": "Miracle", "filename": "Miracle lyric.html", "artist": "Ilse DeLange"},
        {"title": "Miss politician", "filename": "Miss politician.html", "artist": "Ilse DeLange"},
        {"title": "Naked heart", "filename": "Naked heart.html", "artist": "Ilse DeLange"},
        {"title": "New beginning", "filename": "New beginning.html", "artist": "Ilse DeLange"},
        {"title": "Next to me", "filename": "Next to me lyric.html", "artist": "Ilse DeLange"},
        {"title": "No more you", "filename": "No more you.html", "artist": "Ilse DeLange"},
        {"title": "No reason to be shy", "filename": "No reason to be shy.html", "artist": "Ilse DeLange"},
        {"title": "Nobody really knows", "filename": "Nobody really knows.html", "artist": "Ilse DeLange"},
        {"title": "Not waiting for you", "filename": "Not waiting for you.html", "artist": "Ilse DeLange"},
        {"title": "Nothing left to break", "filename": "Nothing left to break.html", "artist": "Ilse DeLange"},
        {"title": "OK", "filename": "OK.html", "artist": "Ilse DeLange"},
        {"title": "Old tears", "filename": "Old tears.html", "artist": "Ilse DeLange"},
        {"title": "Open je ogen", "filename": "Open je ogen.html", "artist": "Ilse DeLange"},
        {"title": "Oud geboren", "filename": "Oud geboren.html", "artist": "Ilse DeLange"},
        {"title": "Paper plane", "filename": "Paper plane.html", "artist": "Ilse DeLange"},
        {"title": "Peaceful in mine", "filename": "Peaceful in mine.html", "artist": "Ilse DeLange"},
        {"title": "Pirate of your soul", "filename": "Pirate of your soul.html", "artist": "Ilse DeLange"},
        {"title": "Puzzle me", "filename": "Puzzle me.html", "artist": "Ilse DeLange"},
        {"title": "Reach for the light", "filename": "Reach for the light lyric.html", "artist": "Ilse DeLange"},
        {"title": "Ride the wind", "filename": "Ride the wind.html", "artist": "Ilse DeLange"},
        {"title": "Riding with the king", "filename": "Riding with the king.html", "artist": "Ilse DeLange"},
        {"title": "Right with you", "filename": "Right with you lyrics.html", "artist": "Ilse DeLange"},
        {"title": "Runaway", "filename": "Runaway lyrics.html", "artist": "Ilse DeLange"},
        {"title": "Shine", "filename": "Shine.html", "artist": "Ilse DeLange"},
        {"title": "Snow tonight", "filename": "Snow tonight.html", "artist": "Ilse DeLange"},
        {"title": "So incredible", "filename": "So incredible.html", "artist": "Ilse DeLange"},
        {"title": "Something amazing", "filename": "Something amazing.html", "artist": "Ilse DeLange"},
        {"title": "Something inside so strong", "filename": "Something inside so strong.html", "artist": "Ilse DeLange"},
        {"title": "Space cowboy", "filename": "Space cowboy.html", "artist": "Ilse DeLange"},
        {"title": "Stay with me", "filename": "Stay with me.html", "artist": "Ilse DeLange"},
        {"title": "Sure Pinocchio", "filename": "Sure Pinocchio.html", "artist": "Ilse DeLange"},
        {"title": "Sun & shadow", "filename": "Sun & shadow lyricks.html", "artist": "Ilse DeLange"},
        {"title": "Tab dancing on the highwire", "filename": "Tap dancing on the highwire.html", "artist": "Ilse DeLange"},
        {"title": "Thank you", "filename": "Thank you.html", "artist": "Ilse DeLange"},
        {"title": "The Angels Rejoiced Last Night", "filename": "The Angels Rejoiced Last Night.html", "artist": "Ilse DeLange"},
        {"title": "The great escape", "filename": "The great escape.html", "artist": "Ilse DeLange"},
        {"title": "The lonely one", "filename": "The lonely one.html", "artist": "Ilse DeLange"},
        {"title": "The other side", "filename": "The other side.html", "artist": "Ilse DeLange"},
        {"title": "The valley", "filename": "The valley.html", "artist": "Ilse DeLange"},
        {"title": "They say (demo version)", "filename": "They say (demo version).html", "artist": "Ilse DeLange"},
        {"title": "Time out", "filename": "Time out.html", "artist": "Ilse DeLange"},
        {"title": "Time Will Have To Wait", "filename": "Time Will Have To Wait.html", "artist": "Ilse DeLange"},
        {"title": "Turn around", "filename": "Turn Around.html", "artist": "Ilse DeLange"},
        {"title": "Untouchable", "filename": "Untouchable.html", "artist": "Ilse DeLange"},
        {"title": "Was it love", "filename": "Was it love.html", "artist": "Ilse DeLange"},
        {"title": "Watch me go", "filename": "Watch me go.html", "artist": "Ilse DeLange"},
        {"title": "Waterfall", "filename": "Waterfall.html", "artist": "Ilse DeLange"},
        {"title": "We are diamonds", "filename": "We are diamonds.html", "artist": "Ilse DeLange"},
        {"title": "We are one", "filename": "We are one.html", "artist": "Ilse DeLange"},
        {"title": "We're alright", "filename": "We're alright.html", "artist": "Ilse DeLange"},
        {"title": "What does your heart say now", "filename": "what does your heart say now.html", "artist": "Ilse DeLange"},
        {"title": "When", "filename": "When.html", "artist": "Ilse DeLange"},
        {"title": "When it's you", "filename": "When it's you.html", "artist": "Ilse DeLange"},
        {"title": "When we don't talk", "filename": "When we don't talk.html", "artist": "Ilse DeLange"},
        {"title": "When you put it like that", "filename": "When you put it like that.html", "artist": "Ilse DeLange"},
        {"title": "Winter of love", "filename": "Winter of love.html", "artist": "Ilse DeLange"},
        {"title": "Without you", "filename": "Without you.html", "artist": "Ilse DeLange"},
        {"title": "World of hurt", "filename": "world of hurt.html", "artist": "Ilse DeLange"},
        {"title": "Wouldn't that be something", "filename": "Wouldn't that be something.html", "artist": "Ilse DeLange"},
        {"title": "You are the dream", "filename": "You are the dream.html", "artist": "Ilse DeLange"},
    ]

    extracted_lyrics = []

    for song in songs:
        html_file_path = Path(clone_dir) / song["filename"]
        if html_file_path.exists():
            try:
                with open(html_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    soup = BeautifulSoup(f, 'html.parser')
                
                lyrics = extract_lyrics_content(soup)
                
                extracted_lyrics.append({
                    "title": song["title"],
                    "artist": song["artist"],
                    "lyrics": lyrics
                })
                
                print(f"Successfully extracted lyrics for: {song['title']}")
            except Exception as e:
                print(f"Error processing file {html_file_path}: {e}")
        else:
            print(f"Could not find file for song: {song['title']} (tried: {html_file_path})")


    output_file = Path("migration_data/extracted_content/lyrics.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_lyrics, f, indent=2, ensure_ascii=False)

    print(f"\nAll lyrics extracted and saved to {output_file}")
    
    # Preview of the first song
    if extracted_lyrics:
        print("\n--- PREVIEW ---")
        print(f"Artist: {extracted_lyrics[0]['artist']}")
        print(f"Title: {extracted_lyrics[0]['title']}")
        print(extracted_lyrics[0]['lyrics'])
        print("--- END PREVIEW ---")


if __name__ == "__main__":
    main()
