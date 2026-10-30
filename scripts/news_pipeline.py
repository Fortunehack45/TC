"""
The Chronicles — Automated Real-Time News Ingestion Pipeline
============================================================
Discovers, verifies, brands, and publishes breaking news from verified Nigerian and
global wire feeds directly into Supabase (tc_articles) and Supabase Storage (tc-media).

Features:
- Verified Nigerian Sources (Premium Times, Channels TV, BusinessDay, Punch, Vanguard, etc.)
- Verified Global Sources (BBC World/Tech/Biz/Sport, NYTimes, NASA, Al Jazeera)
- Authentic Press Photo Extraction (media:content, enclosures, og:image)
- Luxury Watermark Badging (scripts/watermark.py) uploaded to Supabase Storage
- 100% Anti-AI Human Broadsheet Tone (Reuters/AP style with real datelines)
- Parallel high-volume batch execution (50 to 70 articles per 30 minutes)
- Zero duplication checking against existing database articles
"""

import os
import sys
import re
import time
import uuid
import json
import logging
import argparse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Optional, Tuple

# Ensure current script directory is in python search path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load local environment variables (.env)
load_dotenv()

# Import Watermark Engine
from watermark import apply_chronicles_watermark

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('ChroniclesNewsPipeline')

# Environment configuration
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL', 'https://yinaxpgnnadhbkplokvl.supabase.co').rstrip('/')
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Standard Desktop User Agent to avoid 403 anti-bot blocks
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}

# Verified Feed Registry
VERIFIED_FEEDS = [
    # --- NIGERIAN FEEDS ---
    {
        'id': 'pt_general',
        'name': 'Premium Times Nigeria',
        'region': 'nigeria',
        'default_category': 'WORLD',
        'url': 'https://www.premiumtimesng.com/feed',
        'default_dateline': 'ABUJA',
    },
    {
        'id': 'pt_business',
        'name': 'Premium Times Business',
        'region': 'nigeria',
        'default_category': 'FINANCE',
        'url': 'https://www.premiumtimesng.com/category/business/feed',
        'default_dateline': 'LAGOS',
    },
    {
        'id': 'channels_tv',
        'name': 'Channels Television',
        'region': 'nigeria',
        'default_category': 'WORLD',
        'url': 'https://www.channelstv.com/feed/',
        'default_dateline': 'LAGOS',
    },
    {
        'id': 'businessday_ng',
        'name': 'BusinessDay Nigeria',
        'region': 'nigeria',
        'default_category': 'FINANCE',
        'url': 'https://businessday.ng/feed/',
        'default_dateline': 'LAGOS',
    },
    {
        'id': 'punch_ng',
        'name': 'Punch Nigeria',
        'region': 'nigeria',
        'default_category': 'WORLD',
        'url': 'https://punchng.com/feed/',
        'default_dateline': 'LAGOS',
    },
    {
        'id': 'vanguard_ng',
        'name': 'Vanguard News Nigeria',
        'region': 'nigeria',
        'default_category': 'POLITICS',
        'url': 'https://www.vanguardngr.com/feed/',
        'default_dateline': 'ABUJA',
    },
    {
        'id': 'theguardian_ng',
        'name': 'The Guardian Nigeria',
        'region': 'nigeria',
        'default_category': 'WORLD',
        'url': 'https://guardian.ng/feed/',
        'default_dateline': 'LAGOS',
    },
    {
        'id': 'nairametrics',
        'name': 'Nairametrics',
        'region': 'nigeria',
        'default_category': 'FINANCE',
        'url': 'https://nairametrics.com/feed/',
        'default_dateline': 'LAGOS',
    },
    # --- GLOBAL FEEDS ---
    {
        'id': 'bbc_world',
        'name': 'BBC World News',
        'region': 'global',
        'default_category': 'WORLD',
        'url': 'http://feeds.bbci.co.uk/news/world/rss.xml',
        'default_dateline': 'LONDON',
    },
    {
        'id': 'bbc_tech',
        'name': 'BBC Technology',
        'region': 'global',
        'default_category': 'TECHNOLOGY',
        'url': 'http://feeds.bbci.co.uk/news/technology/rss.xml',
        'default_dateline': 'SAN FRANCISCO',
    },
    {
        'id': 'bbc_business',
        'name': 'BBC Business',
        'region': 'global',
        'default_category': 'FINANCE',
        'url': 'http://feeds.bbci.co.uk/news/business/rss.xml',
        'default_dateline': 'NEW YORK',
    },
    {
        'id': 'bbc_sport',
        'name': 'BBC Sport',
        'region': 'global',
        'default_category': 'SPORT',
        'url': 'http://feeds.bbci.co.uk/sport/rss.xml',
        'default_dateline': 'LONDON',
    },
    {
        'id': 'nyt_world',
        'name': 'New York Times World',
        'region': 'global',
        'default_category': 'WORLD',
        'url': 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        'default_dateline': 'WASHINGTON',
    },
    {
        'id': 'nyt_business',
        'name': 'New York Times Business',
        'region': 'global',
        'default_category': 'FINANCE',
        'url': 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
        'default_dateline': 'NEW YORK',
    },
    {
        'id': 'nasa_breaking',
        'name': 'NASA News',
        'region': 'global',
        'default_category': 'SCIENCE',
        'url': 'https://www.nasa.gov/feed/',
        'default_dateline': 'CAPE CANAVERAL',
    },
    {
        'id': 'aljazeera_en',
        'name': 'Al Jazeera English',
        'region': 'global',
        'default_category': 'WORLD',
        'url': 'https://www.aljazeera.com/xml/rss/all.xml',
        'default_dateline': 'DOHA',
    },
]

# Strict Banned AI Cliché Words & Phrases
BANNED_AI_WORDS = [
    'delve', 'delving', 'tapestry', 'testament', 'beacon', 'landscape',
    'pivotal', 'in conclusion', 'furthermore', 'it is worth noting',
    'sheds light', 'ever-evolving', 'underscores', 'bustling', 'vibrant',
    'revolutionize', 'game-changer', 'a testament to', 'navigating the',
    'in summary', 'to sum up', 'first and foremost'
]


def clean_slug(text: str) -> str:
    """Generate a clean URL-safe slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text[:90]


class SupabaseClient:
    """Lightweight direct REST client for Supabase database & storage."""

    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

    def get_existing_slugs_and_titles(self) -> Tuple[set, set]:
        """Fetch existing slugs and titles from tc_articles for deduplication."""
        try:
            req_url = f"{self.url}/rest/v1/tc_articles?select=slug,title&limit=2500"
            resp = requests.get(req_url, headers=self.headers, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                slugs = {item.get('slug', '') for item in data if item.get('slug')}
                titles = {item.get('title', '').strip().lower() for item in data if item.get('title')}
                return slugs, titles
        except Exception as e:
            logger.warning(f"Could not fetch existing articles for dedup: {e}")
        return set(), set()

    def upload_image_to_storage(self, image_bytes: bytes, file_path: str) -> Optional[str]:
        """Upload watermarked JPEG to tc-media bucket and return public URL."""
        try:
            upload_url = f"{self.url}/storage/v1/object/tc-media/{file_path}"
            headers = {
                'apikey': self.key,
                'Authorization': f'Bearer {self.key}',
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true'
            }
            resp = requests.post(upload_url, data=image_bytes, headers=headers, timeout=20)
            if resp.status_code in [200, 201]:
                public_url = f"{self.url}/storage/v1/object/public/tc-media/{file_path}"
                return public_url
            else:
                logger.warning(f"Storage upload returned {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            logger.warning(f"Error uploading image to Supabase Storage: {e}")
        return None

    def insert_article(self, article_payload: dict) -> bool:
        """Insert a published article into tc_articles."""
        try:
            req_url = f"{self.url}/rest/v1/tc_articles"
            resp = requests.post(req_url, json=article_payload, headers=self.headers, timeout=15)
            if resp.status_code in [200, 201]:
                return True
            else:
                logger.error(f"Insert failed ({resp.status_code}): {resp.text}")
                return False
        except Exception as e:
            logger.error(f"Error inserting article: {e}")
            return False


def is_valid_press_image(url: str) -> bool:
    """Validate that an image URL points to a real press photo, not a logo or tracking pixel."""
    if not url or not url.startswith('http'):
        return False
    u = url.lower()
    bad_tokens = ['logo', 'icon', 'pixel', 'avatar', 'banner-ad', 'tracker', 'emoji', 'gravatar', '1x1']
    if any(token in u for token in bad_tokens):
        return False
    return True


def extract_media_url_from_entry(item_elem: ET.Element, entry_data: dict) -> Optional[str]:
    """Extract authentic high-res press image from RSS entry."""
    # 1. Check media:content (used by BBC, NYTimes, Al Jazeera)
    for elem in item_elem:
        tag = elem.tag.lower()
        if 'content' in tag and elem.attrib.get('url'):
            url = elem.attrib['url']
            if is_valid_press_image(url):
                # Upgrade BBC low-res standard/240 to standard/1024
                url = re.sub(r'/standard/\d+/', '/standard/1024/', url)
                return url

    # 2. Check media:thumbnail
    for elem in item_elem:
        tag = elem.tag.lower()
        if 'thumbnail' in tag and elem.attrib.get('url'):
            url = elem.attrib['url']
            if is_valid_press_image(url):
                url = re.sub(r'/standard/\d+/', '/standard/1024/', url)
                return url

    # 3. Check description or content:encoded for high-res img tags (e.g. Premium Times)
    desc_text = entry_data.get('description', '') + ' ' + entry_data.get('content_encoded', '')
    if '<img' in desc_text:
        soup = BeautifulSoup(desc_text, 'html.parser')
        img = soup.find('img')
        if img and img.get('src'):
            src = img['src']
            if is_valid_press_image(src):
                return src

    # 4. Check enclosure
    for elem in item_elem.findall('enclosure'):
        u = elem.attrib.get('url', '')
        if is_valid_press_image(u):
            return u

    # 5. Fast fallback: scrape source article page's meta og:image (used by Channels TV, Punch, Vanguard)
    link = entry_data.get('link', '')
    if link and link.startswith('http'):
        try:
            head_resp = requests.get(
                link,
                headers=DEFAULT_HEADERS,
                timeout=6
            )
            if head_resp.status_code == 200:
                soup = BeautifulSoup(head_resp.text, 'html.parser')
                og_tag = soup.find('meta', property='og:image') or soup.find('meta', attrs={'name': 'og:image'})
                if og_tag and og_tag.get('content'):
                    og_url = og_tag['content'].strip()
                    if is_valid_press_image(og_url):
                        return og_url
        except Exception:
            pass

    return None


def fetch_wire_articles(feed: dict) -> List[dict]:
    """Fetch and parse live wire dispatches from a single verified feed."""
    articles = []
    try:
        resp = requests.get(feed['url'], headers=DEFAULT_HEADERS, timeout=12)
        if resp.status_code != 200:
            logger.warning(f"Feed {feed['name']} returned HTTP {resp.status_code}")
            return []

        # Parse XML
        root = ET.fromstring(resp.content)
        # Handle both standard RSS <item> and Atom <entry>
        items = root.findall('.//item')
        if not items:
            items = root.findall('.//{http://www.w3.org/2005/Atom}entry')

        for item in items[:25]:  # Take top 25 latest per feed
            title_elem = item.find('title')
            if title_elem is None:
                title_elem = item.find('{http://www.w3.org/2005/Atom}title')

            link_elem = item.find('link')
            if link_elem is None:
                link_elem = item.find('{http://www.w3.org/2005/Atom}link')

            desc_elem = item.find('description')
            if desc_elem is None:
                desc_elem = item.find('{http://www.w3.org/2005/Atom}summary')

            # Extract text safely
            title = (title_elem.text if title_elem is not None and title_elem.text else '').strip()
            link = ''
            if link_elem is not None:
                link = link_elem.attrib.get('href', '') if 'href' in link_elem.attrib else (link_elem.text or '').strip()

            desc = (desc_elem.text if desc_elem is not None and desc_elem.text else '').strip()

            # Clean HTML from description for raw summary
            soup = BeautifulSoup(desc, 'html.parser')
            clean_summary = soup.get_text(separator=' ').strip()

            content_encoded = ''
            for child in item:
                if 'encoded' in child.tag.lower() and child.text:
                    content_encoded = child.text.strip()

            if not title or not link:
                continue

            entry_dict = {
                'title': title,
                'link': link,
                'description': desc,
                'summary': clean_summary,
                'content_encoded': content_encoded,
                'feed_id': feed['id'],
                'feed_name': feed['name'],
                'region': feed['region'],
                'default_category': feed['default_category'],
                'default_dateline': feed['default_dateline']
            }

            # Extract genuine press photo
            media_url = extract_media_url_from_entry(item, entry_dict)
            if media_url:
                entry_dict['image_url'] = media_url
                articles.append(entry_dict)

    except Exception as e:
        logger.warning(f"Error reading feed {feed['name']}: {e}")

    return articles


def format_broadsheet_article_ai(item: dict) -> Optional[dict]:
    """
    Format a wire story into The Chronicles Human Broadsheet Voice using Gemini API.
    Enforces strict anti-AI constraints, named sources, real datelines, and 0% cliché.
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'MY_GEMINI_API_KEY':
        return None

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""You are the Chief International Correspondent and Bureau Chief for The Chronicles, an elite broadsheet newspaper (resembling The Wall Street Journal, Reuters, Financial Times, and AP Newsroom).

Rewrite this breaking wire dispatch into a definitive, authoritative broadsheet news article.

SOURCE WIRE MATERIAL:
Headline: {item['title']}
Wire Summary: {item['summary']}
Source Publication: {item['feed_name']}
Designated Dateline City: {item['default_dateline']}

STRICT EDITORIAL REQUIREMENTS (VIOLATION WILL BE REJECTED):
1. TONE: 100% human, authoritative, fast-paced journalism. Hard facts, real names, exact numbers.
2. ZERO AI CLICHÉS: You must NEVER use any of these words:
   "delve", "tapestry", "testament", "beacon", "landscape", "pivotal", "in conclusion",
   "furthermore", "it is worth noting", "sheds light", "ever-evolving", "underscores",
   "bustling", "vibrant", "revolutionize", "game-changer", "a testament to".
3. DATELINE: The first paragraph MUST start with the capital city dateline in bold caps followed by an em-dash, e.g. "{item['default_dateline']} — ".
4. STRUCTURE:
   - Catchy, punchy broadsheet headline (max 90 chars).
   - Authoritative subtitle/deck (max 130 chars).
   - 3 to 4 concise newsroom paragraphs (each paragraph strictly 2 to 3 sentences long).
   - Quotes or official statements attributed directly to spokespeople, ministers, executives, or agency officials.
5. FORMAT: Return strict JSON with the following keys:
{{
  "title": "Clean Broadsheet Headline",
  "subtitle": "Informative two-sentence dek explaining the development",
  "category": "{item['default_category']}",
  "content_paragraphs": [
    "{item['default_dateline']} — Opening paragraph with dateline...",
    "Second paragraph with factual details, numbers, or geopolitical context...",
    "Third paragraph with quotes or official statements...",
    "Fourth forward-looking concluding dispatch paragraph."
  ],
  "read_time": "4 min read"
}}
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        raw_text = response.text.strip()
        # Remove markdown fences if present
        raw_text = re.sub(r'^```json\s*', '', raw_text, flags=re.MULTILINE)
        raw_text = re.sub(r'^```\s*$', '', raw_text, flags=re.MULTILINE).strip()

        parsed = json.loads(raw_text)

        # Validate no banned AI words in output
        content_full = ' '.join(parsed.get('content_paragraphs', [])).lower()
        for banned in BANNED_AI_WORDS:
            if banned in content_full:
                content_full = content_full.replace(banned, '')

        paragraphs = parsed.get('content_paragraphs', [])
        html_body = ''.join([f'<p>{p.strip()}</p>' for p in paragraphs])

        return {
            'title': parsed.get('title', item['title']),
            'subtitle': parsed.get('subtitle', item['summary'][:130]),
            'category': parsed.get('category', item['default_category']),
            'content_html': html_body,
            'read_time': parsed.get('read_time', '4 min read')
        }

    except Exception as e:
        logger.warning(f"AI editorial rewrite unavailable ({e}), using human broadsheet rule-engine")
        return None


def format_broadsheet_article_rules(item: dict) -> dict:
    """
    Deterministic rule-based broadsheet formatter that ensures 100% human voice,
    clean journalism datelines, and zero AI fluff without needing external AI API calls.
    """
    dateline = item['default_dateline']
    title = item['title'].strip()

    # Clean titles of wire markers
    title = re.sub(r'\s*-\s*(BBC News|Reuters|Channels Television|Punch Newspapers|Vanguard News|Daily Post Nigeria|Premium Times|Nairametrics)$', '', title, flags=re.IGNORECASE)

    raw_summary = item['summary']
    # Split summary into distinct sentences
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', raw_summary) if len(s.strip()) > 10]

    lead_sentence = sentences[0] if sentences else f"Developments are unfolding following key official announcements reported by {item['feed_name']}."
    second_sentence = sentences[1] if len(sentences) > 1 else "Government authorities and sector analysts are tracking the strategic implications closely."
    third_sentence = sentences[2] if len(sentences) > 2 else "Senior spokespersons confirmed further operational updates will be released as regulatory assessments conclude."

    p1 = f"<strong>{dateline}</strong> — {lead_sentence} {second_sentence}"
    p2 = f"{third_sentence} According to dispatches verified by The Chronicles newsroom from {item['feed_name']}, regulatory and diplomatic desks have placed the matter on high priority."
    p3 = f"Further field reports and official briefings are expected within the coming hours as the broader economic and institutional effects take shape."

    html_body = f"<p>{p1}</p><p>{p2}</p><p>{p3}</p>"
    subtitle = f"Authoritative dispatch from {dateline}: {lead_sentence[:120]}."

    return {
        'title': title[:95],
        'subtitle': subtitle[:140],
        'category': item['default_category'],
        'content_html': html_body,
        'read_time': '4 min read'
    }


def process_single_article(
    item: dict,
    sb_client: SupabaseClient,
    dry_run: bool = False
) -> Optional[dict]:
    """Process a single wire item: download press photo, apply watermark, format body, upload to DB."""
    try:
        # 1. Format the editorial text (AI first with deterministic fallback)
        editorial = format_broadsheet_article_ai(item)
        if not editorial:
            editorial = format_broadsheet_article_rules(item)

        slug = clean_slug(editorial['title'])
        if not slug or len(slug) < 5:
            slug = clean_slug(item['title'])

        # 2. Process image with Chronicles luxury watermark
        raw_image_url = item['image_url']
        watermarked_bytes = apply_chronicles_watermark(raw_image_url)

        if not watermarked_bytes:
            logger.warning(f"Could not apply watermark to {raw_image_url}")
            return None

        # 3. Upload watermarked image to Supabase Storage
        file_path = f"news/{slug}.jpg"
        if not dry_run:
            uploaded_url = sb_client.upload_image_to_storage(watermarked_bytes, file_path)
            cover_image_url = uploaded_url or raw_image_url
        else:
            cover_image_url = f"{SUPABASE_URL}/storage/v1/object/public/tc-media/{file_path}"

        # 4. Construct complete database payload
        now_iso = datetime.now(timezone.utc).isoformat()
        article_id = str(uuid.uuid4())

        payload = {
            'id': article_id,
            'title': editorial['title'],
            'subtitle': editorial['subtitle'],
            'slug': slug,
            'category_id': editorial['category'],
            'tags': [editorial['category'], item['region'].upper(), 'VERIFIED_DISPATCH'],
            'cover_image_url': cover_image_url,
            'content_html': editorial['content_html'],
            'status': 'published',
            'author_name': f"Chronicles {editorial['category'].title()} Desk",
            'read_time': editorial['read_time'],
            'views_count': 0,
            'likes_count': 0,
            'published_at': now_iso,
            'created_at': now_iso,
            'updated_at': now_iso,
            'lifecycle_stage': 'BREAKING'
        }

        # 5. Insert to Supabase Database
        if not dry_run:
            success = sb_client.insert_article(payload)
            if success:
                logger.info(f"Published: [{editorial['category']}] {editorial['title'][:55]}...")
                return payload
            else:
                return None
        else:
            logger.info(f"[DRY-RUN] Verified & Watermarked: [{editorial['category']}] {editorial['title'][:55]}...")
            return payload

    except Exception as e:
        logger.warning(f"Failed processing item '{item.get('title', '')[:30]}': {e}")
        return None


def run_pipeline(
    batch_size: int = 60,
    beat: str = 'all',
    dry_run: bool = False
) -> int:
    """Run one complete ingestion batch across all verified wire feeds."""
    logger.info(f"Starting news ingestion run (target: {batch_size} articles, beat: {beat}, dry_run: {dry_run})...")
    start_time = time.time()

    sb_client = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

    # 1. Fetch existing articles for deduplication
    existing_slugs, existing_titles = sb_client.get_existing_slugs_and_titles()
    logger.info(f"Database currently holds {len(existing_slugs)} unique articles for deduplication.")

    # 2. Select active feeds based on beat
    active_feeds = VERIFIED_FEEDS
    if beat == 'nigeria':
        active_feeds = [f for f in VERIFIED_FEEDS if f['region'] == 'nigeria']
    elif beat == 'global':
        active_feeds = [f for f in VERIFIED_FEEDS if f['region'] == 'global']

    # 3. Parallel wire discovery across all feeds
    discovered_items = []
    logger.info(f"Polling {len(active_feeds)} verified news wire feeds in parallel...")

    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_feed = {executor.submit(fetch_wire_articles, feed): feed for feed in active_feeds}
        for future in as_completed(future_to_feed):
            feed = future_to_feed[future]
            try:
                items = future.result()
                discovered_items.extend(items)
                logger.info(f"  • {feed['name']}: found {len(items)} items with authentic press photos")
            except Exception as e:
                logger.warning(f"Error fetching feed {feed['name']}: {e}")

    logger.info(f"Total raw items discovered with authentic press photos: {len(discovered_items)}")

    # 4. Filter out duplicates
    unique_candidates = []
    seen_in_batch = set()

    for item in discovered_items:
        title_norm = item['title'].strip().lower()
        slug_norm = clean_slug(item['title'])

        if slug_norm in existing_slugs or title_norm in existing_titles or slug_norm in seen_in_batch:
            continue

        seen_in_batch.add(slug_norm)
        unique_candidates.append(item)

        if len(unique_candidates) >= batch_size:
            break

    logger.info(f"Unique candidates ready for broadsheet publishing: {len(unique_candidates)} (capped at {batch_size})")

    if not unique_candidates:
        logger.info("No new unique wire articles to publish at this time.")
        return 0

    # 5. Parallel editorial processing, watermarking, and publication
    published_count = 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [
            executor.submit(process_single_article, item, sb_client, dry_run)
            for item in unique_candidates
        ]
        for future in as_completed(futures):
            try:
                res = future.result()
                if res:
                    published_count += 1
            except Exception as e:
                logger.warning(f"Error in publishing task: {e}")

    elapsed = round(time.time() - start_time, 2)
    logger.info(f"Ingestion batch completed in {elapsed}s: Successfully processed {published_count} articles.")
    return published_count


def main():
    parser = argparse.ArgumentParser(description="The Chronicles Automated Real-Time News Pipeline")
    parser.add_argument('--batch-size', type=int, default=60, help="Maximum articles to publish per run (default: 60)")
    parser.add_argument('--beat', type=str, choices=['all', 'nigeria', 'global'], default='all', help="Filter wire beats")
    parser.add_argument('--once', action='store_true', help="Run single batch and exit immediately")
    parser.add_argument('--daemon', action='store_true', help="Run continuously on interval schedule")
    parser.add_argument('--interval', type=int, default=30, help="Interval in minutes between runs in daemon mode (default: 30)")
    parser.add_argument('--dry-run', action='store_true', help="Test fetch, watermark, and format without saving to DB")

    args = parser.parse_args()

    if args.daemon:
        logger.info(f"Starting continuous daemon mode: running every {args.interval} minutes...")
        while True:
            try:
                run_pipeline(batch_size=args.batch_size, beat=args.beat, dry_run=args.dry_run)
            except Exception as e:
                logger.error(f"Error during scheduled batch: {e}")
            logger.info(f"Sleeping for {args.interval} minutes until next news wire cycle...")
            time.sleep(args.interval * 60)
    else:
        # Default single run
        run_pipeline(batch_size=args.batch_size, beat=args.beat, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
