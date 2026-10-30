import os
import urllib.request
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

API_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY') or os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or os.environ.get('SUPABASE_URL', '')
BASE_URL = f"{SUPABASE_URL}/rest/v1/tc_articles"

HEADERS = {
    'apikey': API_KEY,
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

BEAT_JOURNALISM = {
    'WORLD': {
        'leads': [
            "In an unprecedented diplomatic breakthrough, representatives from over 140 nations assembled at the Palais des Nations in Geneva to finalize the Global Clean Transition Accord. The treaty establishes enforceable emissions standards, backed by a multi-national green infrastructure development fund.",
            "Across regional capitols and diplomatic outposts, strategic realignments accelerated following this morning's formal ratification of the multilateral security pact. Chief delegates emphasized that cross-border surveillance protocols will operate under unified civilian oversight.",
            "Against a backdrop of heightened geopolitical sensitivity, senior negotiators concluded intensive closed-door deliberations today, announcing a comprehensive maritime trade corridor agreement designed to secure international shipping passages.",
            "Following extensive multilateral working sessions, cross-border delegates finalized a landmark operational accord that harmonizes humanitarian logistics and disaster response corridors across four continents."
        ],
        'second_paras': [
            "Key signatories highlighted the integration of advanced grid automation and offshore wind power networks across developing markets. \"This agreement transcends geopolitical divisions, prioritizing ecological survival and sustainable industrial growth,\" noted UN Chief Climate Representative Dr. Aris Thorne during the plenary declaration.",
            "Field verification data indicates that key benchmarks—ranging from maritime navigational safety to structural logistics transparency—have demonstrated a measurable 28% efficiency dividend compared with historic baselines.",
            "Delegations underscored that rigorous third-party auditing has been integrated at every operational checkpoint, ensuring transparent resource allocation across regional task forces."
        ],
        'subhead1': "Strategic Implications for International Alignment",
        'subhead2': "Operational Roadmaps & Implementation Milestones"
    },
    'POLITICS': {
        'leads': [
            "In a decisive parliamentary maneuver, legislative leaders introduced sweeping devolution measures aimed at transferring fiscal authority and infrastructure governance directly to regional authorities.",
            "Amid intense committee deliberations in the assembly, policymakers approved a comprehensive statutory framework this morning, overhauling executive transparency and public sector procurement benchmarks.",
            "Addressing a packed chamber of lawmakers and civic delegations, constitutional scholars and committee chairs presented the final iteration of the civic rights statutory reform bill.",
            "Following weeks of contentious debate across ministerial departments, the legislative council concluded formal voting on the national governance framework, securing broad cross-party support."
        ],
        'second_paras': [
            "Key parliamentary analysts noted that the legislation establishes independent oversight tribunals and statutory budget guarantees for local administrations across the country.",
            "The measure addresses long-standing institutional friction, instituting direct public consultation windows before major infrastructure mandates take effect.",
            "Legal directors confirmed that constitutional safeguards have been codified to protect regional autonomy while maintaining unified national statutory standards."
        ],
        'subhead1': "Constitutional Mandates & Statutory Oversight",
        'subhead2': "Legislative Implementation Timelines"
    },
    'FINANCE': {
        'leads': [
            "In an assertive monetary reassessment, central bank governors and treasury officials released updated benchmark directives designed to steady liquidity and anchor medium-term sovereign debt spreads.",
            "Surging institutional liquidity across sovereign bond corridors spurred immediate market realignment during early trading sessions, driving benchmark yields lower and stabilizing currency reserves.",
            "Pioneering investment syndicates finalized capital allocations today, deploying substantial funding into resilient green technology infrastructure and regional industrial parks.",
            "Global credit committees and monetary authorities issued a joint communique affirming stabilized capital adequacy benchmarks and announcing upgraded collateral discount terms."
        ],
        'second_paras': [
            "Market indices responded with measured confidence, with high-yield credit spreads compressing and cross-border commercial lending registering robust expansion over the opening quarter.",
            "Senior macroeconomic strategists highlighted that balanced inflationary projections have provided monetary authorities with renewed policy flexibility.",
            "Asset managers emphasized that diversification into tangible asset classes and digital settlements has bolstered institutional risk-weighted profiles."
        ],
        'subhead1': "Market Liquidity and Capital Valuation Dynamics",
        'subhead2': "Macroeconomic Projections & Fiscal Risk Mitigations"
    },
    'TECHNOLOGY': {
        'leads': [
            "In a landmark computational breakthrough, principal research laboratories demonstrated unprecedented micro-architectural coherence, paving the way for next-generation optical quantum computing systems.",
            "Engineers and silicon architects achieved a transformative milestone today, breaking multi-cycle throughput barriers with energy-efficient 2-nanometer ribbon-FET microprocessors.",
            "Accelerating the transition toward decentralized neural acceleration topologies, industry consortiums unveiled an open hardware and telemetry standard supported by top semiconductor fabricators.",
            "Advanced telemetry benchmarking confirmed a 35% performance dividend across distributed neural clusters, substantially reducing latency in autonomous edge computing applications."
        ],
        'second_paras': [
            "System architects emphasized that the newly verified protocols eliminate interconnect bottlenecks while maintaining sub-microsecond latency across dense computing nodes.",
            "Independent testing labs confirmed reproducible results under enterprise operational loads, marking the transition from theoretical proof-of-concept to fabrication readiness.",
            "Open-source hardware foundations announced complementary software driver toolkits to accelerate ecosystem adoption across developer communities."
        ],
        'subhead1': "Architectural Coherence & Compute Benchmarks",
        'subhead2': "Scalability, Open Frameworks & Commercial Integration"
    },
    'SCIENCE': {
        'leads': [
            "In an extraordinary empirical revelation, deep-space observatory teams captured high-resolution spectral signatures of atmospheric biosignatures orbiting an Earth-mass exoplanet in the habitable zone.",
            "Leading biophysical institutes reported conclusive laboratory validation today, unveiling atomic-resolution cryo-electron microscopy models of molecular enzyme repair complexes.",
            "Synthesizing longitudinal field telemetry across extreme oceanic trenches, international scientific consortia published groundbreaking evidence of self-sustaining chemotrophic microbial ecosystems.",
            "Rigorous peer-reviewed analyses published this morning demonstrated that newly synthesized crystalline superconductor candidates retain critical magnetic shielding properties at elevated temperatures."
        ],
        'second_paras': [
            "Principal investigators noted that spectroscopic calibration across multiple satellite arrays eliminated background interference, providing 99.8% statistical confidence in the empirical observations.",
            "The findings open unprecedented avenues for targeted bio-molecular therapies and planetary science, setting standard investigative baselines for the next decade.",
            "Collaborating university departments announced immediate public data releases to enable worldwide verification and secondary research."
        ],
        'subhead1': "Empirical Verification and Spectroscopic Data",
        'subhead2': "Methodological Peer Review & Next Investigative Phases"
    },
    'LIFESTYLE': {
        'leads': [
            "In a deliberate departure from hyper-connected living, contemporary design collectives and master architects are championing restorative sanctuaries built from natural timber, rammed earth, and acoustic serenity.",
            "Artisanal heritage preservation and slow living philosophies took center stage across cultural salons this season, as conscious craft movements inspired a revival in mindful daily rituals.",
            "Exploring the intersections of restorative wellness and architectural purity, leading interior theorists unveiled living spaces calibrated for acoustic balance, circadian lighting, and tactile warmth.",
            "Reimagining residential sanctuaries through timeless craftsmanship and tactile materials, new domestic design philosophies continue to cultivate contemplative calm in urban centers."
        ],
        'second_paras': [
            "Design directors emphasized that integrating biophilic courtyards and locally sourced materials fosters emotional well-being while dramatically reducing environmental footprints.",
            "Cultural anthropologists observed a distinct resurgence in analogue practices, from dedicated reading chambers to artisanal culinary studios.",
            "Sustainable craft guilds reported surging interest among modern homeowners seeking longevity, tactile heritage, and timeless design."
        ],
        'subhead1': "Holistic Spatial Aesthetics and Daily Rituals",
        'subhead2': "Sustainable Heritage Practices for Modern Living"
    },
    'FASHION': {
        'leads': [
            "In a breathtaking atelier presentation, bespoke tailoring houses debuted sculptural silhouettes that harmonize centuries-old hand-stitching with avant-garde circular biopolymer textiles.",
            "Exploring sustainable textile engineering and timeless craftsmanship, leading couturiers redefined runway luxury this season with unhurried tailoring and hand-loomed natural fibers.",
            "From heritage looms in Biella to avant-garde showcases in Paris, master artisans unveiled meticulously finished collections celebrated for architectural drape and sustainable provenance.",
            "Challenging conventional seasonal production cycles, visionary designers introduced circular garment architectures designed for infinite restorative wear and artisanal repair."
        ],
        'second_paras': [
            "Master tailors showcased hand-padded lapels and unlined silk jackets, demonstrating how traditional bespoke disciplines elevate modern functional aesthetics.",
            "Fashion historians and critics heralded the shift toward deliberate permanence, celebrating collections that resist algorithmic trend cycles.",
            "Textile engineers confirmed that newly deployed plant-derived fibers rival traditional cashmere in softness while offering full biodegradability."
        ],
        'subhead1': "Atelier Craftsmanship and Textile Architecture",
        'subhead2': "The Evolution of Circular Luxury & Seasonal Silhouettes"
    },
    'CELEBRITY': {
        'leads': [
            "In an intimate, career-spanning retrospective, acclaimed stage and screen performers convened to discuss the delicate balance between public acclaim, creative vulnerability, and artistic craft.",
            "Commanding international stage acclaim, visionary directors and actors examined transformative cinematic movements in an exclusive, candid salon dialogue.",
            "Reflecting on decades of cultural resonance, industry luminaries shared thoughtful perspectives on creative independence, private sanctuary, and artistic integrity away from algorithmic media.",
            "Amid sold-out international engagements, prominent creative artists outlined ambitious philanthropic foundations dedicated to arts education and historic theatre preservation."
        ],
        'second_paras': [
            "The dialogue explored the challenges of maintaining authentic artistic identity in an era dominated by hyper-condensed digital critique.",
            "Colleagues and directors praised their uncompromising discipline, highlighting transformative contributions to international cinema and humanitarian causes.",
            "Audiences resonated deeply with the emphasis on timeless storytelling, artisanal stage production, and dedicated craft mentorship."
        ],
        'subhead1': "Artistic Evolution Behind the Spotlight",
        'subhead2': "Philanthropic Foundations and Cultural Legacies"
    },
    'SPORT': {
        'leads': [
            "In a masterclass of tactical discipline and relentless competitive resolve, championship contenders delivered an electrifying showcase that redefined contemporary athletic standards.",
            "Telemetry analysis revealed peak biomechanical efficiency as world-class athletes rewrote competitive performance benchmarks across challenging high-altitude conditions.",
            "Executing flawless tactical adjustments across demanding terrain, title contenders secured a historic triumph that capped years of meticulous training and sports science refinement.",
            "Engineering breakthroughs in aerodynamic chassis design and athletic conditioning culminated in a breathtaking competitive performance watched by millions worldwide."
        ],
        'second_paras': [
            "Coaching staffs and performance analysts emphasized how real-time biometric telemetry and tactical flexibility proved decisive during critical closing stages.",
            "The performance highlighted a strategic evolution in athletic preparation, combining precision sports nutrition with high-speed predictive telemetry.",
            "Commentators across international sporting networks heralded the result as a benchmark in modern athletic endurance and tactical mastery."
        ],
        'subhead1': "Tactical Mastery and Aerodynamic Telemetry",
        'subhead2': "Championship Trajectories & Season Standings"
    },
    'EDUCATION': {
        'leads': [
            "In an exhilarating renaissance of academic innovation, distinguished university chancellors and education researchers gathered to advance global curriculum standards.",
            "Higher education leadership councils revealed sweeping pedagogical reforms today, accelerating scientific research initiatives and global scholarly partnerships.",
            "Exploring the frontiers of university education, award-winning educators and faculty fellows examined the transformative potential of immersive learning methodologies.",
            "Global research institutions celebrated a remarkable milestone in student achievement, championing interdisciplinary inquiry, critical pedagogy, and academic excellence."
        ],
        'second_paras': [
            "Distinguished scholars emphasized that open academic inquiry remains the premier cornerstone of intellectual advancement and societal progress.",
            "Education policy directors and faculty deans praised the rigorous standards of modern undergraduate research programs, noting substantial student engagement.",
            "University colloquium organizers confirmed that cross-institutional academic summits will expand globally to cultivate breakthrough discoveries."
        ],
        'subhead1': "Higher Education Frontiers and Pedagogical Innovation",
        'subhead2': "Academic Governance and Global Scholarly Research"
    },
    'BOOKS': {
        'leads': [
            "In an exhilarating renaissance of literary fellowship, distinguished authors and bibliophiles gathered in intimate candlelit salons to celebrate the enduring craft of narrative prose.",
            "Archival historians and independent publishing houses revealed newly restored manuscripts today, illuminating neglected literary movements and breathtaking masterworks of translated poetry.",
            "Exploring the lyrical cadence of contemporary prose, award-winning novelists and essayists examined the irreplaceable power of deep reading away from digital distractions.",
            "Independent literary presses celebrated a remarkable surge in reader engagement, championing bespoke typography, deckle-edged paper, and contemplative literary criticism."
        ],
        'second_paras': [
            "Distinguished authors emphasized that deliberate, long-form narrative exploration remains the premier vehicle for empathy and philosophical nuance.",
            "Book collectors and scholarly reviewers praised the physical artistry of contemporary independent releases, noting a deep appreciation for artisanal bookbinding.",
            "Literary salon hosts confirmed that quarterly discussion circles will expand internationally to foster literary dialogue and creative discourse."
        ],
        'subhead1': "The Architecture of Prose and Narrative Cadence",
        'subhead2': "Archival Preservation and Independent Publishing Horizons"
    }
}

def generate_article_html(title, subtitle, category_id, idx):
    beat = BEAT_JOURNALISM.get(category_id, BEAT_JOURNALISM['WORLD'])
    lead_text = beat['leads'][idx % len(beat['leads'])]
    second_para = beat['second_paras'][idx % len(beat['second_paras'])]
    
    # Extract first letter for the grand red drop-cap
    first_letter = lead_text[0]
    rest_of_lead = lead_text[1:]
    
    deck = subtitle if subtitle else f"Authoritative dispatch on {title}."
    
    html = f"""<p><span class="drop-cap-red">{first_letter}</span>{rest_of_lead}</p>

<p>{second_para}</p>

<blockquote>
  <p>&ldquo;{deck}&rdquo;</p>
  <footer class="text-xs text-stone-400 mt-2.5 not-italic">&mdash; <strong>The Editorial Board</strong>, Senior Correspondent Bureau</footer>
</blockquote>

<h2>{beat['subhead1']}</h2>
<p>The broader institutional ramifications have resonated swiftly across international corridors. Senior policy advisors, academic observers, and industry directors noted that the initiative establishes a benchmark model for cross-border alignment. Stakeholder sentiment reflected immediate confidence following the announcement, with risk metrics moderating to multi-year baselines.</p>

<h3>{beat['subhead2']}</h3>
<p>Looking forward, comprehensive secondary reviews and public working group sessions are scheduled to commence ahead of the upcoming quarterly global symposium. Stakeholders worldwide continue to monitor developments closely as new operational phases unfold.</p>"""

    return html

def update_article(art, idx):
    html = generate_article_html(art['title'], art['subtitle'], art['category_id'], idx)
    payload = json.dumps({'content_html': html, 'updated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}?id=eq.{art['id']}",
        data=payload,
        headers=HEADERS,
        method='PATCH'
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status

def main():
    print("Fetching all 500 articles from Supabase...")
    req = urllib.request.Request(f"{BASE_URL}?select=id,title,subtitle,category_id&order=id.asc", headers=HEADERS)
    res = urllib.request.urlopen(req)
    articles = json.loads(res.read().decode('utf-8'))
    print(f"Total articles to update: {len(articles)}")
    
    completed = 0
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(update_article, art, idx): art['id'] for idx, art in enumerate(articles)}
        for future in as_completed(futures):
            try:
                future.result()
                completed += 1
                if completed % 50 == 0 or completed == len(articles):
                    print(f"Progress: {completed}/{len(articles)} articles updated ({completed*100//len(articles)}%)")
            except Exception as e:
                print(f"Error on {futures[future]}: {e}")
                
    elapsed = time.time() - start_time
    print(f"Successfully updated all {completed} articles in {elapsed:.2f} seconds!")

if __name__ == '__main__':
    main()
