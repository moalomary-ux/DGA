# -*- coding: utf-8 -*-
"""English content model — light executive edit of DOCX EN v3.1.
All facts, figures, prices, dates, programme names, conclusions and source
markers [1]-[71] preserved. Terminology corrected per the binding glossary:
Deputy Minister / Assistant Deputy Minister replace the banned forms."""
import theme as T

DOC_TITLE = "AI Leadership Development for Senior Government Leaders"

TAG_COLORS = {'S': T.TEAL, 'E': T.GREEN, 'P': T.PURPLE, 'R': T.NAVY,
              'N': T.BLUE, 'I': T.GRAY, 'J': T.INK, 'T': T.RED}

L1, L2, L3, L4 = 'purple', 'navy', 'teal', 'green'

PAGES = [
# ---------------------------------------------------------------- 1 cover
{'type': 'cover',
 'badge': 'EXPLORATORY BENCHMARK STUDY  ·  AUGUST 2026',
 'title_lines': [("AI Leadership Development", T.WHITE),
                 ("for Senior Government Leaders", (0x3D, 0xD6, 0xDA))],
 'subtitle': "Global and local benchmarking and a proposed Saudi model for four leadership levels — prepared by the Qudratak programme, Digital Government Authority.",
 'meta_cols': [("DOCUMENT TYPE", "Exploratory benchmark study"),
               ("ISSUE DATE", "August 2026"),
               ("VERSION", "3.1")]},

# ---------------------------------------------------------------- 2 exec summary
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'EXECUTIVE SUMMARY'},
 {'t': 'h1', 'text': 'The study in one page'},
 {'t': 'lede', 'text': 'Commissioned by the Government AI Committee through the training channel [1]; every statement below is evidenced in the sections that follow.'},
 {'t': 'cards', 'cols': 2, 'items': [
   {'tick': 'purple', 'title': 'One question drives the study',
    'body': 'What forms of AI leadership training exist for senior government leaders, what evidence supports them, and what should Saudi Arabia learn, adapt, and build?'},
   {'tick': 'teal', 'title': 'Four levels, not one audience',
    'body': 'Ministers; Vice Ministers and Excellency-rank leaders; Deputy Ministers and Deputy Governors; Assistant Deputy Ministers and equivalent executive leaders. Classification follows decision scope, accountability, and protocol — not job title alone.'},
   {'tick': 'blue', 'title': 'What the market shows',
    'body': 'Across a register of 32 documented programmes, the ease of buying a ready-made programme falls as the leadership level rises; no documented open programme addresses ministers as its primary audience.'},
   {'tick': 'green', 'title': 'The national base is real',
    'body': 'SDAIA has trained more than 278 government leaders [52]; Qudratak holds a national platform and documented academic partnerships [54]. What is missing is one graded, owned, measured programme.'}]},
 {'t': 'gap', 'h': 0.06},
 {'t': 'gpanel', 'paras': [
   ("THE PROPOSED ANSWER",
    "Four interlinked pathways — build locally for Ministers, co-develop for Vice Ministers and Excellency-rank leaders, procure and adapt for Deputy Ministers, license and scale for Assistant Deputy Ministers — sharing one knowledge core, Saudi cases, a unified measurement framework, and national ownership of data and the operating model."),
   ("INDICATIVE COST — NOT A QUOTATION",
    "SAR 45,000–94,000 per participant, and SAR 1.35–2.8 million for a 30-participant cohort, applying mainly to Level 2 or 3 cohorts [65]. Eight recommendations to the Qudratak programme close the study.")]},
]},

# ---------------------------------------------------------------- 3 document map
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'DOCUMENT MAP'},
 {'t': 'h1', 'text': 'Contents'},
 {'t': 'lede', 'text': 'From the commission, to the evidence gathered globally and locally, to a model the Qudratak programme can act on.'},
 {'t': 'toc', 'items': [
   {'num': '01', 'title': 'Study Context and Methodology',
    'desc': 'Why the study was commissioned, its scope and limits, the evidence classification, and the demand indicators.', 'page': 4},
   {'num': '02', 'title': 'The Four Leadership Levels and Their Decision Responsibilities',
    'desc': 'Who is meant, level by level: category, decision type, training protocol, and applied output.', 'page': 9},
   {'num': '03', 'title': 'Benchmarking Findings',
    'desc': '32 documented programmes, ten national experiences, the Kingdom’s own capabilities, and what has matured.', 'page': 15},
   {'num': '04', 'title': 'Availability by Leadership Level',
    'desc': 'What can actually be bought, and what must be built, for each of the four levels.', 'page': 24},
   {'num': '05', 'title': 'The Proposed Model for the Kingdom',
    'desc': 'Four pathways, one shared core, Saudi cases, measurement, indicative cost, and ownership.', 'page': 27},
   {'num': '06', 'title': 'Recommendations for the Qudratak Programme',
    'desc': 'Five evidence-based findings, eight recommendations, and the next steps.', 'page': 33},
   {'num': 'REF', 'title': 'References',
    'desc': '71 numbered, evidence-tagged sources with live links, checked 21 August 2026.', 'page': 36}]},
 {'t': 'gap', 'h': 0.05},
 {'t': 'panel', 'title': 'HOW TO READ THIS DOCUMENT',
  'body': 'An exploratory study describing the market as published up to 21 August 2026. It contains no internal needs assessment, no provider selection, and no contractual price quotation; cost figures are published figures attributed to their publishers, or indicative estimates explicitly labelled as such.'},
]},

# ---------------------------------------------------------------- 4 section 01 + 1.1
{'type': 'section', 'num': 1, 'sec_label': 'SECTION 01',
 'title': 'Study Context and Methodology',
 'lede': 'The commission and its three questions, the scope and its limits, the evidence system, and the demand signals that frame the study.',
 'blocks': [
 {'t': 'kicker', 'text': '1.1  BACKGROUND AND COMMISSIONING'},
 {'t': 'h1', 'text': 'A commission with three questions'},
 {'t': 'body', 'text': 'The Qudratak programme at the Digital Government Authority received a request from the Government AI Committee, through the training channel, to conduct a comparative benchmarking study of AI programmes targeting senior government leaders [1].'},
 {'t': 'cards', 'cols': 3, 'items': [
   {'tick': 'purple', 'title': '1 · What is available?',
    'body': 'What programmes does the global and local market offer this category today?'},
   {'tick': 'teal', 'title': '2 · What have governments done?',
    'body': 'What initiatives have other governments actually implemented for their leaders?'},
   {'tick': 'green', 'title': '3 · How can it be built?',
    'body': 'How can a national programme serve four leadership levels — with an indicative cost estimate?'}]},
 {'t': 'gap', 'h': 0.05},
 {'t': 'panel', 'title': 'THE PROBLEM STATEMENT',
  'body': 'AI decisions in government are no longer technical matters delegated to specialised departments; they have become sovereign decisions touching national data, public procurement, the quality of citizen services, and the foundations of accountability. Those who sign them occupy the senior leadership levels — not the model engineers. The potential gap examined here is therefore not in the national strategy, where the Kingdom’s position is advanced, but in the individual leadership readiness of the decision-maker. The study presumes no deficiency on anyone’s part; it records what the market offers and leaves judgement to the evidence.'},
 {'t': 'transition', 'text': 'Answering the three questions first requires fixing the scope and limits of the review — what the study covers, and what it does not claim.'},
]},

# ---------------------------------------------------------------- 5 scope
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 01 · 1.2  SCOPE AND LIMITS'},
 {'t': 'h1', 'text': 'What the study covers — and what it does not claim'},
 {'t': 'lede', 'text': 'Everything in the study describes the market as it stood on 21 August 2026.'},
 {'t': 'columns', 'widths': [0.5, 0.5], 'columns': [
   [{'t': 'subhead', 'text': 'WITHIN SCOPE', 'color': 'teal'},
    {'t': 'bullets', 'items': [
      'Programmes, frameworks, and practices published up to 21 August 2026.',
      'Publicly available information, plus the internal documents provided under the commission.',
      'Published cost figures attributed to their publishers, or estimates explicitly labelled indicative.']}],
   [{'t': 'subhead', 'text': 'OUT OF SCOPE', 'color': 'purple'},
    {'t': 'bullets', 'items': [
      'An internal needs assessment for each government entity.',
      'The selection of a specific provider.',
      'The submission of any contractual price quotation.'], 'bullet_color': 'purple'}]]},
 {'t': 'gap', 'h': 0.08},
 {'t': 'stats', 'cols': 3, 'num_size': 22, 'items': [
   {'num': '300+', 'color': 'purple', 'label': 'government entities within the study’s scope', 'src': 'Commission [1]'},
   {'num': '32', 'color': 'teal', 'label': 'documented programmes in the benchmark register'},
   {'num': '71', 'color': 'green', 'label': 'numbered sources, each carrying an evidence tag'}]},
 {'t': 'gap', 'h': 0.04},
 {'t': 'panel', 'title': 'THE STANDING PHRASE',
  'body': 'Where no published information is available on a given programme, the study uses the phrase “the review did not identify a publicly documented dedicated programme” — without presuming that none exists.'},
 {'t': 'transition', 'text': 'Because the value of a study of this kind is measured by the strength of its evidence, the next page sets out the evidence classification used throughout all sections.'},
]},

# ---------------------------------------------------------------- 6 evidence codes
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 01 · 1.3  METHODOLOGY AND EVIDENCE CLASSIFICATION'},
 {'t': 'h1', 'text': 'Eight evidence codes, declared once'},
 {'t': 'lede', 'text': 'Every material piece of information carries a numbered source marker leading to the references register — entity, title, full link, and review date. Each source carries a code describing the nature and strength of its evidence.'},
 {'t': 'chips', 'cols': 4, 'items': [
   {'code': 'S', 'label': 'Statistics or survey', 'desc': 'Used within the limits of the sample and methodology.', 'color': 'teal'},
   {'code': 'E', 'label': 'Independent evaluation', 'desc': 'The strongest available evidence of effectiveness.', 'color': 'green'},
   {'code': 'P', 'label': 'Provider announcement', 'desc': 'Establishes the announced design, not the results.', 'color': 'purple'},
   {'code': 'R', 'label': 'Official record', 'desc': 'Used for policies and official figures.', 'color': 'navy'},
   {'code': 'N', 'label': 'Established press source', 'desc': 'Documents the event; read alongside other sources.', 'color': 'blue'},
   {'code': 'I', 'label': 'Sponsor input', 'desc': 'Represents the internal context of the commission.', 'color': T.GRAY},
   {'code': 'J', 'label': 'Analytical judgement', 'desc': 'Built by combining more than one piece of evidence.', 'color': T.INK},
   {'code': 'T', 'label': 'Indicative estimate', 'desc': 'Built on stated assumptions.', 'color': 'red'}]},
 {'t': 'gap', 'h': 0.05},
 {'t': 'panel', 'title': 'ONE DECLARATION, USED THROUGHOUT',
  'body': 'These codes are presented once here and then used wherever needed without repeated explanation. Provider announcements (P) establish design, never impact; analytical judgements (J) and indicative estimates (T) are the study’s own and are marked as such.'},
 {'t': 'transition', 'text': 'With the scope and the evidence system fixed, the next two pages read the global demand indicators and the Kingdom’s position within them.'},
]},

# ---------------------------------------------------------------- 7 demand indicators
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 01 · 1.4  GLOBAL DEMAND INDICATORS'},
 {'t': 'h1', 'text': 'Adoption is widening; high financial impact remains rare'},
 {'t': 'lede', 'text': 'The figures below are indicators of the need to develop leadership capability — not causal proof that leadership is the sole factor in the value gap.'},
 {'t': 'stats', 'cols': 3, 'items': [
   {'num': '78% → 88%', 'color': 'purple',
    'label': 'organisations using AI, March to November 2025', 'src': 'McKinsey surveys [2][3]'},
   {'num': '≈ 6%', 'color': 'teal',
    'label': '“high performers” deriving more than 5% of operating earnings from AI', 'src': 'McKinsey [3]'},
   {'num': '32 / 36', 'color': 'green',
    'label': 'OECD countries announcing government AI training programmes', 'src': 'OECD [14]'}]},
 {'t': 'body', 'text': 'Gartner surveys likewise show that a number of chief executives consider current leadership teams and operating models not yet at the level of readiness required for AI [4][5][6]. In the public sector, Deloitte and Accenture findings point to a gap between deploying tools and the readiness of leaders and the workforce to use them at institutional scale [7][8].'},
 {'t': 'panel', 'title': 'WHAT THE INDICATORS SUPPORT',
  'body': 'Together, these indicators support the need to develop leaders’ capability in governance, prioritisation, and implementation follow-up. They are demand signals, read within the limits of each survey’s sample and methodology — not proof of causality.'},
]},

# ---------------------------------------------------------------- 8 kingdom position
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 01 · 1.4  THE KINGDOM’S POSITION'},
 {'t': 'h1', 'text': 'An advanced national environment — and the question it leaves open'},
 {'t': 'lede', 'text': 'The national indices place the Kingdom at the front of the region; they measure the environment, not the readiness of each leadership level.'},
 {'t': 'stats', 'cols': 2, 'items': [
   {'num': '14th globally · 1st Arab', 'color': 'purple',
    'label': 'Global AI Index 2024 — topping the government-strategy pillar', 'src': 'SPA / Tortoise [9]'},
   {'num': '1st in MENA', 'color': 'teal',
    'label': 'Oxford Insights Government AI Readiness Index 2025', 'src': 'SPA [10]'}]},
 {'t': 'body', 'text': 'These indices measure the national environment — strategy, regulation, institutional infrastructure, and adoption. They do not directly measure the readiness of each leadership level to take AI-related decisions; the study therefore uses them as evidence of the strength of the national environment, not as a substitute for developing leadership capability.'},
 {'t': 'panel', 'title': 'A PRACTICAL SIGNAL FROM THE SPONSOR',
  'body': 'The internal Gartner briefing held by the sponsoring entity recommends that senior leaders receive dedicated one-to-one training, reverse mentoring, and short on-demand units — rather than general staff training [11]. What the market actually offers in these formats is examined in Section 03.'},
 {'t': 'transition', 'text': 'Before examining what the market offers, “senior leaders” must be defined precisely; programmes that treat leaders as a single bloc are no valid basis for comparison. That definition is Section 02.'},
]},

# ---------------------------------------------------------------- 9 section 02 + basis
{'type': 'section', 'num': 2, 'sec_label': 'SECTION 02',
 'title': 'The Four Leadership Levels and Their Decision Responsibilities',
 'lede': 'The classification basis, then each level: its category, the nature of its decisions, the training protocol suited to it, and the applied output expected from it.',
 'blocks': [
 {'t': 'kicker', 'text': '2.1  CLASSIFICATION BASIS'},
 {'t': 'h1', 'text': 'Decision scope classifies participants — job titles do not'},
 {'t': 'body', 'text': 'Structures and job titles differ across the more than 300 government entities within the study’s scope, and titles alone do not uniformly reflect the level of decision or responsibility: two individuals may hold different titles yet take decisions comparable in level and scope [1]. The study therefore adopts four leadership levels according to three criteria, consistent with the OECD framework (2026) that distinguishes staff, leaders, and technical experts — but disaggregating the leader layer into four distinct decision tiers [12].'},
 {'t': 'cards', 'cols': 3, 'items': [
   {'tick': 'purple', 'title': 'Scope of decision', 'body': 'The decision the leader personally bears, and its reach across the entity and beyond.'},
   {'tick': 'teal', 'title': 'Authority and accountability', 'body': 'The level of authority exercised and the accountability attached to it.'},
   {'tick': 'green', 'title': 'Training protocol', 'body': 'The delivery format the category’s protocol and privacy actually permit.'}]},
 {'t': 'gpanel', 'paras': [("THE DESIGN RULE THAT GOVERNS THE WHOLE STUDY",
   "The programme differs by decision type, not by adding or removing hours [13]. This is not one programme in four lengths; it is four leadership pathways — because the decision, the protocol, and the accountability differ from one category to the next.")]},
 {'t': 'cards', 'cols': 4, 'title_size': 9.5, 'items': [
   {'tick': 'purple', 'title': 'Level 1 — Ministers', 'body': 'Direction and public accountability.'},
   {'tick': 'navy', 'title': 'Level 2 — Vice Ministers and Excellency-Rank Leaders', 'body': 'Portfolio, governance, investment.'},
   {'tick': 'teal', 'title': 'Level 3 — Deputy Ministers and Deputy Governors', 'body': 'Readiness, data, contracting.'},
   {'tick': 'green', 'title': 'Level 4 — Assistant Deputy Ministers', 'body': 'Operations and compliance.'}]},
]},

# ---------------------------------------------------------------- 10 level 1
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 02 · 2.2  LEVEL 1'},
 {'t': 'h1', 'text': 'Ministers: a category the conventional course format cannot serve'},
 {'t': 'lede', 'text': 'Target category: ministers holding portfolios, ministers of state, and cabinet-rank appointees.'},
 {'t': 'levelband', 'level': 1, 'label': 'LEVEL 1', 'name': 'Ministers', 'badge': 'Route: build locally'},
 {'t': 'body', 'text': 'A distinct, exceptional leadership category: it bears responsibility for the general direction of the sector, participates in the highest government decisions, and is subject to an official and practical protocol different from every other level — which is why the conventional course format is fundamentally unsuited to it.'},
 {'t': 'columns', 'widths': [0.5, 0.5], 'columns': [
   [{'t': 'subhead', 'text': 'DECISION TYPE — DIRECTION, NOT EXECUTION', 'color': 'purple'},
    {'t': 'bullets', 'bullet_color': 'purple', 'items': [
      'Setting the strategic direction of the sector.',
      'Defining the acceptable level of risk.',
      'Approving major priorities.',
      'Taking decisions shared across entities.',
      'Considering major investments and transformations.',
      'Bearing public responsibility for outcomes.']}],
   [{'t': 'subhead', 'text': 'THE PROTOCOL THE CATEGORY REQUIRES', 'color': 'teal'},
    {'t': 'bullets', 'items': [
      'Short, closed sessions.',
      'A very limited number of participants.',
      'Executive, non-technical content.',
      'Clear contractual confidentiality.',
      'Cases linked to real decisions.',
      'A final output: a memorandum or a decision position.']}]]},
 {'t': 'gap', 'h': 0.06},
 {'t': 'panel', 'title': 'APPLIED OUTPUT',
  'body': 'A confidential decision memorandum on an actual file: the objective, the public value, the level of risk, the responsible entity, and the conditions for continuation or termination.'},
 {'t': 'gpanel', 'paras': [("THE BUILD-OR-BUY DECISION FOR THIS LEVEL",
   "Build locally. No open programme addresses ministers as its primary category; documented coverage appears only in closed or sovereign formats — the full availability analysis is in Section 04 [31][28].")]},
]},

# ---------------------------------------------------------------- 11 level 2
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 02 · 2.3  LEVEL 2'},
 {'t': 'h1', 'text': 'Vice Ministers and Excellency-rank leaders: a distinct tier that must not be merged downward'},
 {'t': 'lede', 'text': 'Target category: vice ministers; their equivalents among governors of authorities and government entities; assistant ministers; and other titles accredited as equivalent in authority and protocol.'},
 {'t': 'levelband', 'level': 2, 'label': 'LEVEL 2', 'name': 'Vice Ministers and Excellency-Rank Leaders', 'badge': 'Route: co-develop'},
 {'t': 'body', 'text': 'A senior leadership category that sits below the ministerial level but must not be merged with deputy ministers or executive leaders: it differs in scope of authority, degree of accountability, handling of investment portfolios, direct engagement with the ministerial level, and the training protocol appropriate to it. Its essence is translating ministerial direction into funded, governed work.'},
 {'t': 'columns', 'widths': [0.5, 0.5], 'columns': [
   [{'t': 'subhead', 'text': 'DECISION TYPE — PORTFOLIO AND GOVERNANCE', 'color': 'navy'},
    {'t': 'bullets', 'bullet_color': 'navy', 'items': [
      'Converting the minister’s direction into a portfolio of initiatives.',
      'Prioritising use cases, funding, and priorities.',
      'Approving the operating governance model.',
      'Monitoring investment performance.',
      'Taking continuation or termination decisions.',
      'Managing coordination across entities and sectors.']}],
   [{'t': 'subhead', 'text': 'THE PROTOCOL THE CATEGORY REQUIRES', 'color': 'teal'},
    {'t': 'bullets', 'items': [
      'Small, selective cohorts.',
      'A high level of privacy.',
      'Saudi government cases.',
      'Peer learning among participants of the same level.',
      'An intensive programme or short executive residency.',
      'Applied follow-up after the programme.']}]]},
 {'t': 'gap', 'h': 0.06},
 {'t': 'panel', 'title': 'APPLIED OUTPUT',
  'body': 'A portfolio and governance package: prioritised use cases, owners, budgets, controls, and implementation phases.'},
 {'t': 'gpanel', 'paras': [("THE BUILD-OR-BUY DECISION FOR THIS LEVEL",
   "Co-develop. Selective programmes accept this category but lack Saudi cases and local ownership of confidentiality and measurement — the fit is a trusted partner with a Saudi owner (Section 04) [32][35].")]},
]},

# ---------------------------------------------------------------- 12 level 3
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 02 · 2.4  LEVEL 3'},
 {'t': 'h1', 'text': 'Deputy Ministers and Deputy Governors: the last principal review before commitments are made'},
 {'t': 'lede', 'text': 'Target category: deputy ministers, deputy governors, and titles equivalent in executive authority.'},
 {'t': 'levelband', 'level': 3, 'label': 'LEVEL 3', 'name': 'Deputy Ministers, Deputy Governors, and Equivalent Leaders', 'badge': 'Route: procure and adapt'},
 {'t': 'body', 'text': 'This level translates the approved portfolio into readiness and execution decisions, and is the last principal level to review many initiatives before budget, time, and contracting commitments are made. Its training content is therefore closer to guided application than to general awareness.'},
 {'t': 'columns', 'widths': [0.5, 0.5], 'columns': [
   [{'t': 'subhead', 'text': 'DECISION TYPE — READINESS AND COMMITMENT', 'color': 'teal'},
    {'t': 'bullets', 'items': [
      'Assessing the readiness of use cases.',
      'Taking decisions on data, access, and sharing.',
      'Reviewing contracting and procurement.',
      'Managing security and regulatory risks.',
      'Following up implementation and preparing the workforce.',
      'Ensuring clear performance indicators and owners exist.']}],
   [{'t': 'subhead', 'text': 'THE PROTOCOL THE CATEGORY REQUIRES', 'color': 'purple'},
    {'t': 'bullets', 'bullet_color': 'purple', 'items': [
      'Guided executive cohorts.',
      'A blended programme extending over several weeks.',
      'Application to a real work case.',
      'Practical training on procurement, data, and governance.',
      'Executive coaching or supervision of the applied project.']}]]},
 {'t': 'gap', 'h': 0.06},
 {'t': 'panel', 'title': 'APPLIED OUTPUT',
  'body': 'An implementation charter linking the use case to data, controls, contracting, the owner, phases, and measurement indicators.'},
 {'t': 'gpanel', 'paras': [("THE BUILD-OR-BUY DECISION FOR THIS LEVEL",
   "Procure and adapt. Documented applied programmes exist for this layer — buy models or seats to verify design quality, then adapt with Saudi cases and unified measurement (Section 04) [18][22].")]},
]},

# ---------------------------------------------------------------- 13 level 4
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 02 · 2.5  LEVEL 4'},
 {'t': 'h1', 'text': 'Assistant Deputy Ministers and executive leaders: converting controls into daily working procedures'},
 {'t': 'lede', 'text': 'Target category: assistant deputy ministers; chief executives in government entities according to entity size and scope of authority; executive directors; chief officers; and equivalent titles directly supervising execution and operations.'},
 {'t': 'levelband', 'level': 4, 'label': 'LEVEL 4', 'name': 'Assistant Deputy Ministers and Equivalent Executive Leaders', 'badge': 'Route: license, localise, and scale'},
 {'t': 'body', 'text': 'The level closest to operations and actual application. It differs from Level 3 in that its greater focus is converting policies and controls into daily work procedures — and monitoring teams’ compliance with them.'},
 {'t': 'columns', 'widths': [0.5, 0.5], 'columns': [
   [{'t': 'subhead', 'text': 'DECISION TYPE — DAILY OPERATIONS', 'color': 'green'},
    {'t': 'bullets', 'bullet_color': 'green', 'items': [
      'Applying tools within workflows.',
      'Monitoring responsible use.',
      'Converting controls into operating procedures.',
      'Preparing teams and monitoring performance and deviations.',
      'Escalating risks and unexpected cases.',
      'Documenting compliance.']}],
   [{'t': 'subhead', 'text': 'THE PROTOCOL THE CATEGORY REQUIRES', 'color': 'teal'},
    {'t': 'bullets', 'items': [
      'Direct applied content.',
      'Guided blended or digital learning.',
      'Cases linked to daily operations.',
      'Ready-to-use tools and checklists.',
      'Follow-up of application and compliance indicators.']}]]},
 {'t': 'gap', 'h': 0.06},
 {'t': 'panel', 'title': 'APPLIED OUTPUT',
  'body': 'An application plan at sector or department level, linked to an operational log of compliance with controls and risk escalation.'},
 {'t': 'gpanel', 'paras': [("THE BUILD-OR-BUY DECISION FOR THIS LEVEL",
   "License, localise, and scale. Content is abundant; the work is selection, localisation, and linking completion to performance indicators via the Qudratak platform (Section 04) [48][52].")]},
]},

# ---------------------------------------------------------------- 14 summary of levels
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 02 · 2.6  SUMMARY OF LEVELS AND OUTPUTS'},
 {'t': 'h1', 'text': 'Four categories, four decisions, four applied outputs'},
 {'t': 'lede', 'text': 'The colours introduced here identify each level in every table and figure that follows.'},
 {'t': 'table',
  'headers': ['Level', 'Core category', 'Equivalent titles', 'Principal decision', 'Applied output'],
  'widths': [0.10, 0.17, 0.30, 0.23, 0.20], 'size': 8.5,
  'rows': [
    ['1', 'Minister', 'Minister of state, and cabinet-rank appointees', 'Strategic direction and public accountability', 'Confidential decision memorandum'],
    ['2', 'Vice minister', 'Governor, assistant minister, and equivalent Excellency-rank titles', 'Portfolio, governance, and investment', 'Portfolio and governance package'],
    ['3', 'Deputy minister', 'Deputy governor, and equivalent executive titles', 'Readiness, data, contracting, and execution', 'Implementation charter'],
    ['4', 'Assistant deputy minister', 'Chief executive, executive director, chief officer — by entity size and role authority', 'Operational application and compliance', 'Application plan and compliance log']],
  'cell_fills': {(0, 0): (0xEC, 0xE0, 0xF8), (1, 0): (0xE2, 0xE0, 0xF0),
                 (2, 0): (0xD9, 0xF1, 0xF2), (3, 0): (0xDD, 0xF5, 0xEA)},
  'col_styles': {0: {'style': 'bold', 'color': T.INK, 'align': 'c'},
                 1: {'style': 'semi', 'color': T.INK}}},
 {'t': 'panel', 'title': 'THE RULE THAT TRAVELS WITH THE TABLE',
  'body': 'Equivalent titles are indicative. Participant classification is determined by scope of authority, decision type, level of accountability, and leadership protocol — not job title alone. This rule pre-empts objections arising from differences in structures between entities and makes the classification applicable to any entity, whatever its hierarchy.'},
 {'t': 'transition', 'text': 'With the four categories and their decision responsibilities defined, the question becomes: what does the global and local market actually offer each of them? Section 03 answers with the benchmark.'},
]},

# ---------------------------------------------------------------- 15 section 03 + 3.1
{'type': 'section', 'num': 3, 'sec_label': 'SECTION 03',
 'title': 'Benchmarking Findings',
 'lede': 'The types of international programmes, the register and its prices, country experiences, the Kingdom’s own capabilities, and what has matured versus what remains a gap.',
 'blocks': [
 {'t': 'kicker', 'text': '3.1  TYPES OF INTERNATIONAL PROGRAMMES'},
 {'t': 'h1', 'text': 'Three market categories — conflating them is the root of procurement errors'},
 {'t': 'body', 'text': 'The comparison rests on a register of 32 documented programmes whose provider pages, announced audiences, and published prices were reviewed as of 21 August 2026 — in a context where 32 of 36 OECD countries announce government AI training programmes [14]. The sample divides into three categories that differ in ownership, pricing logic, and purchasability.'},
 {'t': 'cards', 'cols': 3, 'body_size': 8, 'items': [
   {'tick': 'purple', 'title': '1 · Prominent commercial programmes',
    'body': 'Major business schools, mixed-sector executive audiences, US$12,000–28,000 a seat: Kellogg US$28,000 [15]; MIT xPRO US$25,000–28,000 by pricing cycle [16]; Cambridge Judge £20,000 (≈ SAR 101,993) [17]. The participant buys the university name and a largely corporate peer network; the price reflects academic brand, faculty, and network — not government fit.'},
   {'tick': 'teal', 'title': '2 · Dedicated government programmes',
    'body': 'Written for government employees by name, and systematically cheaper: free (US Partnership for Public Service [18]; GSA series [19]); a few hundred euros (Ireland’s IPA masterclass, €480 ≈ SAR 2,101 [20]); a few thousand dollars (Darden US$4,700 [21]; Johns Hopkins US$2,450 at review date [22]); capped by the Lee Kuan Yew School at S$6,800 [23]. Pricing is mission-driven — Google.org granted US$10m [24] and US$5m [25] — but several of the most relevant programmes are restricted by nationality or employer.'},
   {'tick': 'navy', 'title': '3 · Closed sovereign programmes',
    'body': 'Built by states for themselves and never sold: the UAE’s approved target of 80,000 federal employees — an announced target, not a completion figure [26][27][28]; Singapore’s announced institute for 150,000+ [29]; the UK’s Digital Excellence Programme for the Senior Civil Service [30]; Ghana’s closed ministerial bootcamp with UNDP [31].'}]},
 {'t': 'gpanel', 'paras': [("THE MEANING OF THE THIRD CATEGORY",
   "What reaches a minister’s office is a sovereign decision to build — not an educational product picked off a commercial shelf. A programme’s existence in the market is one thing; a Saudi leader’s ability to enrol in it is another.")]},
]},

# ---------------------------------------------------------------- 16 register part 1
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.2  LEADING PROGRAMMES AND PRICES — 1 OF 2'},
 {'t': 'h1', 'text': 'The open market: what a seat costs, and who it is announced for'},
 {'t': 'lede', 'text': 'Announced audiences as stated on provider pages; prices in the original currency with the approximate riyal equivalent.'},
 {'t': 'table',
  'headers': ['Programme — provider', 'Announced audience', 'Duration and format', 'Price (≈ SAR)', 'Access', 'Src'],
  'widths': [0.24, 0.24, 0.17, 0.17, 0.13, 0.05], 'size': 7.5, 'hsize': 8,
  'rows': [
    ['AI and Digital Transformation for Public Policy Leaders — Lee Kuan Yew School (NUS)',
     'Mid- and senior-level government officials responsible for digital transformation or AI strategy',
     '4 in-person days (10–13 Nov 2026; scheduled, not yet delivered)',
     'S$6,800 + tax (≈ 20,050; early bird S$5,440 until 30 Sep 2026)', 'Open', '[23]'],
    ['Global AI Leadership Program (GAILP) — MBZUAI',
     'Senior government officials, global executives, C-suite leaders',
     '5 days, Abu Dhabi', 'AED 45,000 incl. tax (≈ 45,950)', 'Selective / by invitation', '[32] [33]'],
    ['MBZUAI Executive Program (MEP) — MBZUAI',
     'Senior executives and high-ranking officials in the UAE',
     '16 weeks', 'AED 35,000 (≈ 35,739)', 'UAE-oriented', '[34]'],
    ['Leading AI through Co-Creation — Blavatnik School, Oxford',
     'Senior leaders and practitioners responsible for AI strategy, governance, development, or implementation',
     '6 days (29 Nov–4 Dec 2026; first cohort scheduled, not yet delivered)',
     '£10,250 (≈ 52,271)', 'Open, selective admission', '[35]'],
    ['Leading in Artificial Intelligence — Harvard Kennedy School',
     'Mixed audience incl. senior government and military leaders and elected officials',
     'One in-person week', 'US$11,700 incl. accommodation and most meals (≈ 43,875)', 'Open', '[36]'],
    ['AI Essentials for Government Leaders — Darden, University of Virginia',
     'Government-sector leaders and related industries',
     '2.5 days, Washington DC area', 'US$4,700 (≈ 17,625; 20% government and military discount)', 'Open', '[21]']],
  'col_styles': {0: {'style': 'semi', 'color': T.INK, 'size': 7.5},
                 5: {'color': T.TEAL, 'align': 'c', 'size': 7}}},
 {'t': 'note', 'text': 'Published prices are individual seat prices in open, mixed-sector cohorts; they do not represent offers for closed cohorts. A customised programme is priced as a project, not as seats, and universities publish no price cards for it [39].'},
]},

# ---------------------------------------------------------------- 17 register part 2
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.2  LEADING PROGRAMMES AND PRICES — 2 OF 2'},
 {'t': 'h1', 'text': 'The government-dedicated layer: cheaper, and mostly restricted'},
 {'t': 'lede', 'text': 'The rows below include the designs most relevant to the public context — and the access restrictions that come with them.'},
 {'t': 'table',
  'headers': ['Programme — provider', 'Announced audience', 'Duration and format', 'Price (≈ SAR)', 'Access', 'Src'],
  'widths': [0.24, 0.24, 0.17, 0.17, 0.13, 0.05], 'size': 7.5, 'hsize': 8,
  'rows': [
    ['AI Policy Fellowship — Imperial College London',
     'Senior civil servants deepening their understanding of AI’s role in the public sector',
     '9 months; individual research project within the fellow’s entity',
     '£1,500 (≈ 7,649)', 'De facto restricted (listed cohorts are British)', '[37] [38]'],
    ['AI Government Leadership Program — Partnership for Public Service',
     'Federal GS-15 employees; Senior Executive Service members and equivalents',
     '6 half-day sessions over 4 months, virtual', 'Free', 'Restricted (US federal government only)', '[18]'],
    ['AI for Senior Federal Government Leaders — Johns Hopkins University',
     'GS-14/15 leaders and O-5/O-6 ranks', '10 weeks, blended remote',
     'US$2,450 at review date (≈ 9,188) *', 'Restricted (US federal and defence framework)', '[22]'],
    ['AI Training Series — US General Services Administration (GSA)',
     'Government employees with a .GOV or .MIL email; includes a leadership and policy track with Princeton',
     '21 online sessions across three tracks', 'Free', 'Restricted', '[19]'],
    ['AI Masterclass for Senior Public Service Leaders — Institute of Public Administration (Ireland)',
     'Senior public service leaders at board level', 'One day, Dublin',
     '€480 (≈ 2,101)', 'Open to the public service within an Irish framework', '[20]'],
    ['Cambridge AI Leadership Programme — Judge Business School',
     'Senior leaders navigating digital disruption', '4 months blended (two residencies + distance learning)',
     '£20,000 (≈ 101,993)', 'Open', '[17]']],
  'col_styles': {0: {'style': 'semi', 'color': T.INK, 'size': 7.5},
                 5: {'color': T.TEAL, 'align': 'c', 'size': 7}}},
 {'t': 'note', 'text': '(*) The Johns Hopkins page previously listed a shorter 4-week version at a lower price; the price should be reconfirmed before any enrolment [22]. The Lee Kuan Yew School and Blavatnik programmes are scheduled, not yet delivered, as of the review date; Blavatnik’s first cohort begins on 29 November 2026 [35].'},
]},

# ---------------------------------------------------------------- 18 reading the register
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.2  READING THE REGISTER'},
 {'t': 'h1', 'text': 'No documented open programme names ministers as its primary audience'},
 {'t': 'lede', 'text': 'Three observations carry the rest of the study.'},
 {'t': 'findings', 'items': [
   {'n': 1, 'color': 'purple', 'title': 'Options thin out as the leadership level rises',
    'body': 'Open programmes serve Levels 3 and 4 to a greater degree. The programmes that reached ministers and Excellency-rank leaders did so mostly through closed or selective formats or government partnerships; the announced ceiling stops at “senior leaders”, and what actually reached ministers came in closed sovereign formats [31][26].'},
   {'n': 2, 'color': 'teal', 'title': 'Fit and access pull apart',
    'body': 'The designs most suitable for Levels 2 and 3 — Partnership, Imperial, Johns Hopkins, GSA — are restricted by nationality or employer. Open to Saudi leaders remain the Lee Kuan Yew School, Darden, Blavatnik (selectively), and MBZUAI’s selective regional programme.'},
   {'n': 3, 'color': 'green', 'title': 'Price does not correlate with fit',
    'body': 'The most expensive row in the register is purely corporate (Cambridge), while the cheapest paid row (Imperial) is the deepest in application. Price signals academic brand — not governmental quality.'}]},
 {'t': 'transition', 'text': 'If this is what the market sells, what did governments do when they decided to train their leaders rather than wait for it? The national experiences follow.'},
]},

# ---------------------------------------------------------------- 19 experiences table
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.3  INTERNATIONAL GOVERNMENT EXPERIENCES'},
 {'t': 'h1', 'text': 'Ten experiences: from legislative mandate to sovereign assignment'},
 {'t': 'lede', 'text': 'During 2025–2026, government-leader AI training moved in more than ten countries from intentions to organised policies: operating programmes, trained cohorts, issued mandates, and one control-group pilot evaluation.'},
 {'t': 'table',
  'headers': ['Country', 'Model', 'Target level', 'Mechanism', 'Scale and status', 'Src'],
  'widths': [0.11, 0.24, 0.20, 0.22, 0.18, 0.05], 'size': 7.5, 'hsize': 8,
  'rows': [
    ['Ghana', 'Three-day residential ministerial bootcamp', 'The full Cabinet (Level 1)', 'Sovereign invitation; performance indicators per ministry', 'Entire government across five ministerial clusters', '[31]'],
    ['UAE', 'National programme, five tracks, “Jahiz” platform', 'Ministers to new recruits (Levels 1–4)', 'Mandatory course on Jahiz linked to an announced service target', 'Target of 80,000 federal employees (a target, not an achievement)', '[26] [27]'],
    ['UK', 'Digital Excellence Programme; “One Big Thing”', 'Senior Civil Service (≈7,000) and general staff', 'Voluntary (departments purchase licences)', '≈2,500 licences by Sep 2024; inconclusive independent pilot evaluation', '[30] [40]'],
    ['India', 'National iGOT platform linked to annual appraisal', 'Central employees and civil-service officers', 'Mandatory; recorded in annual appraisal from AY 2025–26', '218 courses; 73M+ enrolments', '[41]'],
    ['Kazakhstan', '“500 AI Officers” corps', 'Vice ministers and deputy governors (Level 2)', 'Presidential assignment', 'First cohort of 100, en route to 500', '[42]'],
    ['Egypt', 'Arabic-language “AI for Government Entity Leaders”', 'Senior entity leaders (Levels 2–3)', 'Pre/post assessment and capstone projects', 'Not announced', '[43]'],
    ['Singapore', 'Digital Government Institute', '150,000+ employees and senior leaders', 'Mandatory foundation units (at launch)', 'Announced March 2026; not yet started', '[29]'],
    ['Australia', 'Mandatory module, AI officers, senior-leaders track', '185,000 employees and senior leaders', 'Mandatory deadlines (first: 15 June 2026)', '185,000 employees', '[44]'],
    ['France', 'Pix platform for the civil service', 'State employees generally', 'Large-scale assessment and training via the platform', 'Ambition of 100,000 during 2025', '[45]'],
    ['EU', 'Article 4 of the AI Act', 'All deployers and operators, incl. public bodies', 'Regulatory mandate in force since 2 Feb 2025', 'All member states', '[46]']],
  'col_styles': {0: {'style': 'semi', 'color': T.INK, 'size': 7.5},
                 5: {'color': T.TEAL, 'align': 'c', 'size': 7}}},
 {'t': 'note', 'text': 'Two structural observations: every experience that crossed the Level 1–2 threshold came in a closed sovereign format, not a purchased product; and impact evidence is weak throughout, rising to an independent evaluation only in the UK pilot — described by its evaluator as inconclusive.'},
]},

# ---------------------------------------------------------------- 20 cases A
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.3  THE FORMATS THAT REACHED THE TOP'},
 {'t': 'h1', 'text': 'Ghana, the UAE, and the United Kingdom'},
 {'t': 'lede', 'text': 'The clearest closed ministerial case, the region’s cascading national model, and the strongest evaluation evidence in the study.'},
 {'t': 'cards', 'cols': 1, 'body_size': 8.5, 'items': [
   {'tick': 'green', 'title': 'Ghana — a closed ministerial format  ·  DELIVERED',
    'body': 'A three-day residential programme, 25–27 July 2025, bringing together the ministers of all five ministerial clusters with a designated focal point from each ministry — completion conditional on use outputs and performance indicators for each ministry [31]. Its significance for the Kingdom: a minister is trained when the performance indicator bears their name, not when general courses are made available.'},
   {'tick': 'navy', 'title': 'UAE — a multi-track national model  ·  ANNOUNCED TARGET',
    'body': 'A cascading delegation architecture: Cabinet approval on 18 May 2026 of a training target of 80,000 federal employees — a target, not a completion figure — across five tracks led by ministers [26]; a knowledge partnership with MBZUAI on 21 May 2026 [27]; a forum on 20 May 2026 with more than 400 ministers and federal officials chaired by the head of government [28]; an executive programme for chief AI officers after the role was created by Cabinet decision [47]; and a mandatory course for all federal employees via “Jahiz” [48]. Most notable: training linked to an announced operational target, and the leadership role created before its occupant is trained.'},
   {'tick': 'blue', 'title': 'United Kingdom — a senior-leaders programme with a pilot evaluation  ·  INDEPENDENT EVALUATION',
    'body': 'The Digital Excellence Programme targets the Senior Civil Service; purchased licences reached about 2,500 of about 7,000 by September 2024 [30]. The Cabinet Office commissioned the first control-group pilot evaluation of a training course in the history of the civil service: “promising evidence” of improved self-reported behaviour, described by its evaluator as inconclusive [40]. The “One Big Thing” campaign reached 212,000 employees, with a senior-leaders track in the “AI for All” edition [49]. The clearest voluntary model — and the strongest evaluation evidence in the study, inconclusive though it remains.'}]},
]},

# ---------------------------------------------------------------- 21 cases B
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.3  LINKAGE AND MANDATE PATTERNS'},
 {'t': 'h1', 'text': 'India, Kazakhstan, Egypt, Singapore — and the escalation of linkage'},
 {'t': 'cards', 'cols': 2, 'body_size': 8, 'items': [
   {'tick': 'teal', 'title': 'India — learning tied to appraisal',
    'body': 'From assessment year 2025–26, completing iGOT courses is mandatory for central employees and civil-service officers and is recorded verbatim in annual appraisal reports (APAR), per written answers before the Lok Sabha, August 2026 [41]. 218 courses, 73M+ enrolments — but enrolment volume is not evidence of capability without a published impact evaluation.'},
   {'tick': 'purple', 'title': 'Kazakhstan — targeting Level 2',
    'body': '“AI Governance 500”, launched January 2026 through the Academy of Public Administration under the Presidency: a first cohort of 100 drawn from vice ministers and deputy governors, en route to a designated corps of 500 “AI officers” [42] — the closest structural counterpart to a named, accountable Saudi corps.'},
   {'tick': 'green', 'title': 'Egypt — an Arabic-language programme',
    'body': 'Launched June 2026 for senior leaders of government entities, in partnership between the Ministry of Communications and the National Training Academy, with pre- and post-assessment and capstone projects [43] — the closest comparison culturally and linguistically to the Saudi case.'},
   {'tick': 'navy', 'title': 'Singapore — announced, not yet started',
    'body': 'The Digital Government Institute, announced 2 March 2026, is to train more than 150,000 employees through mandatory foundation units, jointly owned by the Ministry of Digital Development and Information and the Civil Service College [29]. As of the review date it has not begun operations and cannot be cited as a working model.'}]},
 {'t': 'panel', 'title': 'SCALE AND MANDATE — AUSTRALIA, FRANCE, THE EU, RWANDA',
  'body': 'Australia combined a mandatory module for 185,000 employees, chief AI officers in every entity, and a senior-leaders track, first deadline 15 June 2026 [44]. France launched Pix for the civil service with an ambition of 100,000 employees during 2025 [45]. The EU’s AI Act Article 4 has made AI literacy a legal obligation on deployers and operators, including public bodies, since 2 February 2025 [46]. Rwanda issued a general mandate for civil servants in January 2026 [50].'},
 {'t': 'body', 'size': 9, 'text': 'The linkage instruments escalate — from binding legislation (EU), to recording in job appraisal (India), to direct political assignment (Kazakhstan and the UAE) — and accountability roles preceded training in the UAE, Australia, and Kazakhstan. None of these countries has published evidence of impact on decision quality or institutional performance [51].'},
 {'t': 'transition', 'text': 'After this picture of the world, a fair comparison requires asking: what capabilities does the Kingdom actually possess today?'},
]},

# ---------------------------------------------------------------- 22 KSA capabilities
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.4  CAPABILITIES WITHIN THE KINGDOM'},
 {'t': 'h1', 'text': 'Real components — not yet assembled into one graded programme'},
 {'t': 'cards', 'cols': 2, 'body_size': 8, 'items': [
   {'tick': 'teal', 'title': 'SDAIA — capability proven by numbers',
    'body': 'More than 278 government leaders trained in data and AI by June 2026, up from about 80 at end-2024, within a beneficiary base exceeding 1,563,983 [52][53]. The published information does not show distribution across the four levels, nor curricula and measurement detail.'},
   {'tick': 'purple', 'title': 'Qudratak — a suitable base, needing specialised content',
    'body': 'A digital-leadership track with seven specialisations and documented academic partnerships with Harvard, Berkeley, Imperial, and Columbia [54]. The track as documented addresses digital leadership — not AI decisions specifically; needed: AI-decision content, Saudi cases, unified measurement.'},
   {'tick': 'navy', 'title': 'Stanford participation — proven demand',
    'body': 'In November 2025 a Saudi delegation including ministers and senior officials joined an AI leadership programme at Stanford, organised with Accenture and AI Inspire [55]. Evidence of real, paid demand — and of the need for a local option, since the external format controls neither cases, nor confidentiality, nor measurement.'},
   {'tick': 'green', 'title': 'Local commercial programmes — recurring demand, no gradation',
    'body': '“AI for Leaders and Decision-Makers”, owned and delivered by Renad Al Majd, ran three times (May 2025, Oct 2025, Apr 2026); King Saud University hosted the April 2026 edition as venue only [56][57]. Named attendance at executive-director and general-supervisor level — the equivalent of Levels 3–4 — with no published evidence of ministers or assistant ministers [56].'}]},
 {'t': 'note', 'text': 'The Institute of Public Administration also holds an established leaders academy and widely deployed development tracks [58]; the review did not identify a publicly documented dedicated AI leadership programme at the Institute or at the major Saudi universities — an absence in the record as of the review date, not proof of non-existence.'},
 {'t': 'image', 'path': 'ASSET_CITY', 'h': 1.05},
 {'t': 'transition', 'text': 'The local gap is narrower than “nothing”: a quantitative training base, a platform with partnerships, proven senior demand, and recurring commercial demand. What is missing is organisation into one programme with one owner and one specification.'},
]},

# ---------------------------------------------------------------- 23 matured vs gap
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 03 · 3.5  WHAT HAS MATURED AND WHAT REMAINS A GAP'},
 {'t': 'h1', 'text': 'Content has matured; gradation, confidentiality, and measurement have not'},
 {'t': 'lede', 'text': 'Three lists, according to what the published evidence establishes as of the review date — a work map, not a value judgement.'},
 {'t': 'columns', 'widths': [0.34, 0.36, 0.30], 'columns': [
   [{'t': 'subhead', 'text': 'MATURED — REPEATED EVIDENCE', 'color': 'teal', 'size': 9.5},
    {'t': 'bullets', 'size': 8, 'items': [
      'Foundational content for non-specialists: mature curricula at Harvard Kennedy and Blavatnik [36][35].',
      'Governance and responsible use as a common pillar of serious programmes [22][35].',
      'Government cases and scenarios — LKY School; Harvard’s “AI in Action” [23][59].',
      'Peer-learning formats: Imperial’s cohort spans 16 entities; Partnership’s are cross-agency [38][18].',
      'Digital programmes for executive levels, from the GSA’s free series to national platforms [19][41].']}],
   [{'t': 'subhead', 'text': 'SCATTERED — FEW PLACES, INCOMPLETE FORM', 'color': 'purple', 'size': 9.5},
    {'t': 'bullets', 'size': 8, 'bullet_color': 'purple', 'items': [
      'Gradation across four levels: the UAE’s five categories and Singapore’s leadership components are announcements, not operations [26][29].',
      'A dedicated protocol for Ministers and Excellency-rank leaders — absent outside closed sovereign formats [31].',
      'Saudi government cases: no provider announces accredited ones.',
      'Contractual confidentiality: open programmes publish no confidentiality framework.',
      'Post-programme follow-up: little beyond individual coaching (Partnership) and the “5 days + 90 days” model (MBRSG) [18][60].',
      'Measurement linked to decisions: the sole exception is the UK control-group pilot, described as inconclusive [40].']}],
   [{'t': 'subhead', 'text': 'NOT ESTABLISHED BY PUBLISHED EVIDENCE', 'color': 'navy', 'size': 9.5},
    {'t': 'bullets', 'size': 8, 'bullet_color': 'navy', 'items': [
      'The impact of programmes on the quality of government decisions.',
      'Their impact on institutional performance or service quality.',
      'The effectiveness of a single model for all four levels [51].']}]]},
 {'t': 'gap', 'h': 0.06},
 {'t': 'gpanel', 'paras': [("THE STRATEGIC OPENING",
   "Content is no longer the problem — mature curricula are ready to buy. The design attributes the Kingdom needs (level gradation, the summit protocol, Saudi cases, confidentiality, follow-up, measurement) exist only as scattered elements no announced product has assembled. Most consequential: no one in the entire register holds a leadership programme of proven impact backed by independent evidence — whoever builds measurement from the first cohort gets ahead of the whole market [51].")]},
 {'t': 'transition', 'text': 'What can be bought from this market, and what needs to be built, for each of the four levels? Section 04 answers.'},
]},

# ---------------------------------------------------------------- 24 section 04 + L1 L2
{'type': 'section', 'num': 4, 'sec_label': 'SECTION 04',
 'title': 'Availability by Leadership Level',
 'lede': 'What can actually be bought for each level, and what needs to be built — within the limits of what is published and documented up to 21 August 2026.',
 'blocks': [
 {'t': 'kicker', 'text': '4.1 – 4.2  THE TOP TWO LEVELS'},
 {'t': 'h1', 'text': 'Build for Ministers; co-develop for Vice Ministers and Excellency-rank leaders'},
 {'t': 'cards', 'cols': 1, 'body_size': 8.5, 'items': [
   {'tick': 'purple', 'title': 'Level 1 — Ministers   ·   Verdict: build a locally owned Saudi format',
    'body': 'The review did not identify an open programme designed for ministers as the primary category. Documented ministerial coverage appears in closed, governmental, or specially arranged formats: Ghana’s closed residential bootcamp with UNDP [31]; the UAE’s closed national forum reviewing flagship AI projects [28]; and the Kingdom’s own delegation, including ministers, to Stanford in November 2025 [55]. The absence has a structural explanation: the category’s protocol — confidential deliberations, very small numbers, content tied to live decisions — is incompatible with an open-course format anyone can pay to enter. This level is a build decision, not a longer search of provider catalogues.'},
   {'tick': 'navy', 'title': 'Level 2 — Vice Ministers and Excellency-Rank Leaders   ·   Verdict: co-develop with a trusted partner',
    'body': 'Selective programmes accept senior government leaders — certain MBZUAI programmes [32] and Oxford’s Blavatnik programme [35] — but they are not designed exclusively for vice ministers, governors, and assistant ministers, and do not necessarily include Saudi cases or a local protocol for confidentiality and measurement. GAILP and the MBZUAI Executive Program (MEP) [34] offer a high-level selective residency, yet their cases and contractual controls remain the provider’s property, designed for a broader regional audience. Real but incomplete value — the fit is co-development: a trusted international or regional partner, and a Saudi owner controlling cases, confidentiality, and measurement.'}]},
]},

# ---------------------------------------------------------------- 25 L3 L4
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 04 · 4.3 – 4.4  THE EXECUTION LEVELS'},
 {'t': 'h1', 'text': 'Procure and adapt for Level 3; license and scale for Level 4'},
 {'t': 'cards', 'cols': 1, 'body_size': 8.5, 'items': [
   {'tick': 'teal', 'title': 'Level 3 — Deputy Ministers and Deputy Governors   ·   Verdict: verify, procure, adapt',
    'body': 'A larger set of applied government programmes serves this level, especially in the US and UK. The AI Government Leadership Program offers free cohorts of 25–30 government leaders with an application roadmap per participant [18]; Johns Hopkins offers a blended ten-week programme for senior federal leaders [22]; Egypt launched a national Arabic-language initiative for entity leaders [43]. This layer changes the nature of the Saudi decision: from a costly, lengthy build to verify-and-adapt — buy models or seats to verify design quality and fit, then adapt for local delivery with Saudi cases and a unified measurement framework.'},
   {'tick': 'green', 'title': 'Level 4 — Assistant Deputy Ministers and Equivalent Executive Leaders   ·   Verdict: license, localise, scale',
    'body': 'Broad content and digital and blended programmes are available: major business schools’ online courses [61]; the free, licensable baseline from Apolitical — which the UAE made mandatory for all federal employees [48]; and SDAIA’s accumulated national content [52]. The challenge is not a shortage of content but selecting the right content and linking it to application, compliance, and performance measurement; abundant material unlinked to job appraisal produces learning hours, not changed practice. Qudratak’s contribution here is organisational first: select, license, localise, and link completion to performance indicators.'}]},
]},

# ---------------------------------------------------------------- 26 availability matrix
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 04 · 4.5  OVERALL AVAILABILITY SUMMARY'},
 {'t': 'h1', 'text': 'The ease of buying a ready-made programme falls as the level rises'},
 {'t': 'lede', 'text': 'Levels 1 and 2 require building and customisation; Levels 3 and 4 can be procured, adapted, and licensed.'},
 {'t': 'table',
  'headers': ['Level', 'Dedicated programme?', 'Best documented examples', 'Duration', 'Delivery', 'Price'],
  'widths': [0.14, 0.17, 0.26, 0.13, 0.14, 0.16], 'size': 7.5, 'hsize': 8,
  'rows': [
    ['1 — Ministers', 'Not in the open market; closed or sovereign coverage only',
     'Ghana ministerial bootcamp [31]; UAE national forum [28]; SDAIA delegation at Stanford [55]',
     'Short sessions to a 3-day residency', 'Closed, sovereign, or special arrangement', 'Not announced; not openly purchasable'],
    ['2 — Vice Ministers and Excellency-rank', 'Limited evidence via selective programmes not exclusive to this category',
     'GAILP (MBZUAI) [32]; Leading AI through Co-Creation (Blavatnik) [35]; MEP [34]',
     '5–6 days residential; 16 weeks (MEP)', 'Open selective residency, or internally restricted',
     'AED 45,000 ≈ SAR 45,950 (GAILP); £10,250 ≈ SAR 52,271 (Blavatnik); AED 35,000 ≈ SAR 35,739 (MEP)'],
    ['3 — Deputy Ministers and Deputy Governors', 'Yes — the broadest dedicated layer in the market',
     'Free AI GLP, cohorts of 25–30 [18]; Johns Hopkins federal programme [22]; Egypt’s Arabic initiative [43]',
     '4–10 blended weeks, up to several months', 'Guided blended cohorts, employer-restricted or open',
     'Free to US$2,450 ≈ SAR 9,188 (Johns Hopkins, to be reconfirmed); major open programmes far higher'],
    ['4 — Assistant Deputy Ministers and executive leaders', 'Yes — broad content in multiple formats',
     'Oxford Saïd online courses [61]; Apolitical licensable baseline [48]; national platforms and SDAIA content [52]',
     'Short units to 6-week online courses', 'Self-paced or guided online', 'From zero to £2,450 ≈ SAR 12,494']],
  'cell_fills': {(0, 0): (0xEC, 0xE0, 0xF8), (1, 0): (0xE2, 0xE0, 0xF0),
                 (2, 0): (0xD9, 0xF1, 0xF2), (3, 0): (0xDD, 0xF5, 0xEA)},
  'col_styles': {0: {'style': 'semi', 'color': T.INK, 'size': 7.5}}},
 {'t': 'panel', 'title': 'A STRUCTURAL PATTERN, NOT A MARKET COINCIDENCE',
  'body': 'The titles “vice minister”, “governor”, and “assistant minister” appear explicitly in no documented programme’s announced audience; actual coverage arrives through functional equivalents — permanent secretaries in the UK programme [30], deputy ministers in the UAE executive programme [34], GS-15 and SES grades in the US programmes [18]. The gap at Levels 1–2 is therefore presentational more than cognitive — session confidentiality, small cohorts, trusted government cases, decision relevance — since suitable content exists in the market and can be obtained [62].'},
 {'t': 'transition', 'text': 'On this conclusion, Section 05 builds the proposed model for the Kingdom.'},
]},

# ---------------------------------------------------------------- 27 section 05 + pathways
{'type': 'section', 'num': 5, 'sec_label': 'SECTION 05',
 'title': 'The Proposed Model for the Kingdom',
 'lede': 'Four interlinked pathways — not one programme in four lengths — sharing one knowledge core, Saudi cases, unified measurement, and national ownership [63].',
 'blocks': [
 {'t': 'kicker', 'text': '5.1  THE FOUR PATHWAYS'},
 {'t': 'h1', 'text': 'Each route follows what the availability map established'},
 {'t': 'cards', 'cols': 4, 'title_size': 9.5, 'body_size': 7.5, 'items': [
   {'tick': 'purple', 'title': 'Ministers — build locally',
    'body': 'A closed Saudi format: short decision sessions, limited numbers, high confidentiality, a signed output. Proposed cohort: no more than 12 participants [63].'},
   {'tick': 'navy', 'title': 'Vice Ministers and Excellency-rank — co-develop',
    'body': 'A selective programme with an international or regional partner — and Saudi cases under Saudi ownership.'},
   {'tick': 'teal', 'title': 'Deputy Ministers — procure and adapt',
    'body': 'Draw on existing documented programmes, then deliver local cohorts.'},
   {'tick': 'green', 'title': 'Assistant Deputy Ministers — license and scale',
    'body': 'Digital and blended content via the Qudratak platform.'}]},
 {'t': 'gpanel', 'paras': [("THE SHARED FOUNDATION — OWNED ONCE, USED BY ALL FOUR ROUTES",
   "One knowledge core · a Saudi case library · one measurement framework · one confidentiality and governance protocol · national ownership of data and the operating model.")]},
 {'t': 'body', 'size': 9, 'text': 'Build where the market offers no enrolable format; co-develop where selective programmes exist but lack local ownership; procure and adapt where documented models are available; license and scale where content is broad and digital. The ministerial cohort’s size makes that pathway’s economics fundamentally different from the Level 3 and 4 cohorts [63].'},
 {'t': 'transition', 'text': 'Despite their differences, the four pathways share a single knowledge core — the subject of the next page.'},
]},

# ---------------------------------------------------------------- 28 core + branches
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 05 · 5.2  THE COMMON CORE AND SPECIALISED CONTENT'},
 {'t': 'h1', 'text': 'Seven shared components; four decision-specific branches'},
 {'t': 'lede', 'text': 'A single core prevents duplicate spending on content development and ensures one vocabulary spoken by the minister and the assistant deputy minister when they handle the same file [63].'},
 {'t': 'cards', 'cols': 4, 'title_size': 8.5, 'min_h': 0.52, 'items': [
   {'tick': 'purple', 'title': 'AI capabilities and limits'}, {'tick': 'teal', 'title': 'Governance'},
   {'tick': 'green', 'title': 'Risks'}, {'tick': 'blue', 'title': 'Responsible use'},
   {'tick': 'purple', 'title': 'Economic aspects'}, {'tick': 'teal', 'title': 'Public value'},
   {'tick': 'green', 'title': 'Accountability'},
   {'tick': 'navy', 'title': 'One vocabulary across levels'}]},
 {'t': 'subhead', 'text': 'HOW CONTENT BRANCHES BY LEVEL', 'color': 'purple'},
 {'t': 'cards', 'cols': 2, 'body_size': 8.5, 'items': [
   {'tick': 'purple', 'title': 'Ministers’ pathway',
    'body': 'Setting strategic direction; defining the acceptable level of risk; drafting the decision memorandum.'},
   {'tick': 'navy', 'title': 'Vice Ministers and Excellency-rank pathway',
    'body': 'Portfolio management; prioritising use cases; approving the governance model.'},
   {'tick': 'teal', 'title': 'Deputy Ministers’ pathway',
    'body': 'Readiness assessment; data and contracting decisions; preparing the implementation charter.'},
   {'tick': 'green', 'title': 'Assistant Deputy Ministers’ pathway',
    'body': 'Converting controls into operating procedures; checklists; the compliance log.'}]},
 {'t': 'panel', 'title': 'THE RULE, RESTATED ONCE',
  'body': 'The programme differs by decision type — not by adding or removing hours.'},
]},

# ---------------------------------------------------------------- 29 cases + partners
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 05 · 5.3 – 5.4  SAUDI CASES · DELIVERY AND PARTNERS'},
 {'t': 'h1', 'text': 'Hired expertise is separated from owned capability'},
 {'t': 'columns', 'widths': [0.5, 0.5], 'columns': [
   [{'t': 'subhead', 'text': 'SAUDI CASES — THE LAYER THE MARKET DOES NOT SELL', 'color': 'purple', 'size': 10},
    {'t': 'body', 'size': 8.5, 'text': 'A library of cases linked to actual government decisions is developed after the owning entities’ approval and the handling of confidentiality requirements. The cases remain a locally owned knowledge asset, developable with each cohort. In the market reviewed, no provider was identified announcing accredited Saudi government cases [62] — starting early is what transforms the programme from borrowed content into a national capability whose value accumulates.'}],
   [{'t': 'subhead', 'text': 'DELIVERY AND PARTNERS — WHO DOES WHAT', 'color': 'teal', 'size': 10},
    {'t': 'body', 'size': 8.5, 'text': 'The international partner provides methodology, expertise, and faculty. The Qudratak programme leads operations and the relationship with government entities, and retains ownership of the data, cases, and measurement framework as stipulated in the contracts. A close pattern is documented at Singapore’s announced Digital Government Institute, combining government funding and academic partnership in one entity [29]. Even in pathways where seats are bought or content licensed, this separation remains constant.'}]]},
 {'t': 'gap', 'h': 0.08},
 {'t': 'gpanel', 'paras': [("WHY THIS DIVISION MATTERS",
   "It separates expertise that is hired from capability that is owned. What is hired accelerates launch but does not accumulate with the owner; what is owned accumulates with every cohort and cannot be bought ready-made [70].")]},
]},

# ---------------------------------------------------------------- 30 measurement + governance
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 05 · 5.5  MEASUREMENT, GOVERNANCE, AND CONFIDENTIALITY'},
 {'t': 'h1', 'text': 'Measurement starts before the programme; governance separates six elements'},
 {'t': 'columns', 'widths': [0.52, 0.48], 'columns': [
   [{'t': 'subhead', 'text': 'SIX GRADUATED MEASUREMENT STEPS [63]', 'color': 'teal', 'size': 10},
    {'t': 'ladder', 'items': [
      'Foundational understanding',
      'Quality of judgement on scenarios',
      'Quality of the applied output',
      'Application of the output after the programme',
      'Impact on the entity’s decisions',
      'Institutional or service impact, when data allow'], 'step_h': 0.37, 'indent': 0.9}],
   [{'t': 'subhead', 'text': 'SIX GOVERNANCE ELEMENTS, USUALLY CONFLATED', 'color': 'purple', 'size': 10},
    {'t': 'bullets', 'size': 8.5, 'bullet_color': 'purple', 'items': [
      'Contractual confidentiality.',
      'Data ownership.',
      'The Chatham House Rule.',
      'The use of participants’ names.',
      'The retention of cases and documents.',
      'Access privileges.']},
    {'t': 'panel', 'title': 'WHY THE RULE ALONE IS NOT ENOUGH', 'size': 8,
     'body': 'The Chatham House Rule governs what may be recounted about a session; it governs neither data ownership, nor case retention, nor marketing using participants’ names. These mechanisms are documented clause by clause in contracts and procured independently of content, as bodies specialised in senior-leadership protocols do [64].'}]]},
 {'t': 'gap', 'h': 0.04},
 {'t': 'panel', 'title': 'THE EVALUATION CONTEXT',
  'body': 'As of the review date, the study identified a limited number of published evaluations of programmes of this kind — most notably the UK Cabinet Office’s independent evaluation of the Digital Excellence Programme, described by its evaluators as inconclusive [40]. By building measurement from the first cohort, the proposed programme adds a more rigorous evaluation to that thin global record.'},
]},

# ---------------------------------------------------------------- 31 cost
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 05 · 5.6  INDICATIVE COST'},
 {'t': 'h1', 'text': 'An indicative envelope — not a quotation'},
 {'t': 'lede', 'text': 'Executive-education institutions price customised programmes as projects at full economic cost; their economics require a minimum cohort of roughly 10–15 participants [39].'},
 {'t': 'stats', 'cols': 2, 'num_size': 21, 'items': [
   {'num': 'SAR 45,000 – 94,000', 'color': 'purple',
    'label': 'per participant — indicative estimate for a 30-participant cohort at Level 2 or 3', 'src': 'Study estimate [65]'},
   {'num': 'SAR 1.35 – 2.8 million', 'color': 'teal',
    'label': 'total per 30-participant cohort', 'src': 'Study estimate [65]'}]},
 {'t': 'panel', 'title': 'HOW TO READ THESE FIGURES',
  'body': 'Indicative estimates, not contractual offers [65]. The estimate does not apply directly to the ministerial pathway — small cohort, high customisation and confidentiality — nor to Level 4, which relies more heavily on licensing and digital scaling.'},
 {'t': 'table',
  'headers': ['Cost component', 'Indicative share of cohort cost'],
  'widths': [0.62, 0.38], 'size': 8,
  'rows': [
    ['Content design, needs analysis, and Saudi adaptation', '12–18%'],
    ['Faculty (academics and practitioners, ≈10 teaching days)', '25–35%'],
    ['Saudi case development (local cases and simulations)', '8–12%'],
    ['Arabic localisation (content, translation, faculty preparation, materials, platform)', 'A separate line, estimated at pathway design — not merged into technology'],
    ['Programme management and operations', '10–15%'],
    ['Executive coaching and application-project supervision', '8–12%'],
    ['Venue, accommodation, and hospitality', '8–12%'],
    ['Technology, learning platform, and delivery', '5–8%'],
    ['Evaluation and impact measurement (baseline and dashboards)', '4–7%'],
    ['Annual refresh and alumni community', '5–8%, from year two']],
  'col_styles': {0: {'style': 'semi', 'color': T.INK}},
  'highlight_rows': [1]},
 {'t': 'note', 'text': 'The percentages are planning ranges by pathway format — not a single budget summing its upper bounds. A governance-and-confidentiality line of 2–4% is added for packaging the ministerial cohort [65].'},
]},

# ---------------------------------------------------------------- 32 cost reading + ownership
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 05 · 5.6 – 5.7  READING THE COST · OWNERSHIP'},
 {'t': 'h1', 'text': '“Who teaches” is the most expensive decision; the accumulating assets are the cheapest'},
 {'t': 'findings', 'title_size': 10, 'items': [
   {'n': 1, 'color': 'purple', 'title': 'Faculty absorbs a quarter to a third',
    'body': 'That makes “who teaches” the most expensive design decision — and the first to be negotiated. The overall estimate is consistent with published custom engagements (under US$100,000 to US$2 million [66]) and with major university platforms (US$2,000–50,000 per participant [67]); it can fall 40–55% with a more virtual design, on IMD’s documented in-person-versus-virtual differential [68].'},
   {'n': 2, 'color': 'teal', 'title': 'The two assets that accumulate locally are among the cheapest lines',
    'body': 'Saudi cases and evaluation. Open-purchase seats offer a reference before any custom build: four LKY School seats — three paid, the fourth free under the School’s offer — cost S$20,400 (≈ SAR 60,000) before tax [23][69]; a Darden seat at the government rate is US$3,760 (≈ SAR 14,100) [21]. The accounting caution: open-seat fees are not multiplied by cohort size — the custom cohort carries its full design on its first cohort, while the open seat lacks customisation and local cases [69].'}]},
 {'t': 'columns', 'widths': [0.5, 0.5], 'columns': [
   [{'t': 'subhead', 'text': 'SOURCED INTERNATIONALLY', 'color': 'teal'},
    {'t': 'bullets', 'size': 8.5, 'items': [
      'Methodology.', 'Faculty.', 'Comparative expertise.', 'Certifications.',
      'The academic brand, when needed.']}],
   [{'t': 'subhead', 'text': 'RETAINED UNDER LOCAL OWNERSHIP', 'color': 'purple'},
    {'t': 'bullets', 'size': 8.5, 'bullet_color': 'purple', 'items': [
      'Saudi cases.', 'The four-level framework.', 'Participant data.', 'Measurement results.',
      'The operating model and local materials.', 'The relationship with government entities.']}]]},
 {'t': 'note', 'text': 'What is in the first list accelerates launch but does not accumulate with the owner; what is in the second accumulates with every cohort and cannot be bought ready-made [70]. Kazakhstan’s reminder: Stanford and OpenAI Academy professors trained its senior executives — launch speed that limits local accumulation unless coupled with systematic transfer of knowledge and ownership [71].'},
 {'t': 'transition', 'text': 'The model is complete — pathways, content, partners, measurement, cost, ownership. What remains is its translation into recommendations for the Qudratak programme.'},
]},

# ---------------------------------------------------------------- 33 section 06 + findings
{'type': 'section', 'num': 6, 'sec_label': 'SECTION 06',
 'title': 'Recommendations for the Qudratak Programme',
 'lede': 'Five evidence-based findings, eight interlinked recommendations, and the steps that follow.',
 'blocks': [
 {'t': 'kicker', 'text': '6.1  KEY FINDINGS'},
 {'t': 'findings', 'size': 8.5, 'items': [
   {'n': 1, 'color': 'purple', 'title': 'Availability is inversely graded with leadership level',
    'body': 'The higher the level, the fewer the openly enrolable programmes — until dedicated supply disappears entirely at the ministerial level in the market reviewed (Section 04). Build and customisation effort concentrates at Levels 1–2; Levels 3–4 are managed through purchase, adaptation, and licensing.'},
   {'n': 2, 'color': 'teal', 'title': 'Published evaluations of this type of programme are limited globally',
    'body': 'The most prominent identified: a single independent control-group evaluation of the UK programme, described by its evaluators as inconclusive [40]. Rigorous measurement from the first cohort gives the Saudi programme a knowledge contribution beyond its local boundaries.'},
   {'n': 3, 'color': 'green', 'title': 'Senior-leadership demand exists within the Kingdom and is documented',
    'body': 'A delegation including ministers and senior officials joined the Stanford programme in November 2025 — evidence of real, paid demand [55]; hence the importance of a local option honouring the Saudi context, language, confidentiality, and measurement.'},
   {'n': 4, 'color': 'blue', 'title': 'Existing national capabilities are broader than zero',
    'body': 'SDAIA: more than 278 government leaders trained by June 2026 [52]; Qudratak: a national platform and documented academic partnerships since October 2021 [54]. What is needed is a layer of organisation, ownership, and measurement on top — not a separate foundation.'},
   {'n': 5, 'color': 'navy', 'title': 'Linking training to assignment or appraisal expands coverage',
    'body': 'The UK’s voluntary programme reached about 2,500 of about 7,000 targeted by September 2024 [30]; India achieved broad coverage by linking training to annual appraisal [41]. Read with due regard for context, the implication is that institutional linkage is an early design decision, not a later addition.'}]},
]},

# ---------------------------------------------------------------- 34 eight recommendations
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 06 · 6.2  THE FINAL RECOMMENDATION'},
 {'t': 'h1', 'text': 'Eight interlinked recommendations to the Qudratak programme'},
 {'t': 'cards', 'cols': 2, 'body_size': 8, 'items': [
   {'tick': 'purple', 'title': '1 · Adopt the four-level classification',
    'body': 'Four levels by decision scope and leadership protocol, admitting equivalent titles because entity structures differ; classification by scope of authority and decision type — not job title alone.'},
   {'tick': 'purple', 'title': '2 · Build a dedicated pathway for ministers',
    'body': 'Neither open programmes nor conventional courses fit: short, closed sessions built on actual decisions, a cohort of no more than 12, a signed output per session [63].'},
   {'tick': 'navy', 'title': '3 · Designate a protocol for Vice Ministers and Excellency-rank leaders',
    'body': 'Vice ministers, governors, and assistant ministers are a distinct category between the minister and the deputy minister: selective cohorts, high privacy, content on portfolios, governance, and investment.'},
   {'tick': 'teal', 'title': '4 · Draw on the market for Levels 3 and 4',
    'body': 'Purchase existing models or content, then adapt to the Saudi government context — rather than building all content from scratch.'},
   {'tick': 'green', 'title': '5 · Build Saudi cases early',
    'body': 'Local cases are the most important element of programme fit; they must not be left to a later stage or to the international provider alone.'},
   {'tick': 'green', 'title': '6 · Build measurement from the first cohort',
    'body': 'Measurement tied to decisions and applied outputs — not confined to participant satisfaction or hours completed.'},
   {'tick': 'teal', 'title': '7 · Draw on existing national capabilities',
    'body': 'Build on SDAIA’s programmes, the Qudratak platform, current academic partnerships, and proven leadership demand — not a separate system from zero [52][54].'},
   {'tick': 'navy', 'title': '8 · Retain national ownership of the accumulating elements',
    'body': 'Draw on international expertise while cases, data, measurement, and the operating model remain under Saudi ownership in accordance with the contracts [70].'}]},
]},

# ---------------------------------------------------------------- 35 next steps / closing
{'type': 'content', 'blocks': [
 {'t': 'kicker', 'text': 'SECTION 06 · 6.3  NEXT STEPS'},
 {'t': 'h1', 'text': 'What starts first — and how the model corrects itself'},
 {'t': 'cards', 'cols': 2, 'body_size': 8.5, 'items': [
   {'tick': 'purple', 'title': 'What the study recommends',
    'body': 'Four interlinked pathways under the leadership of the Qudratak programme — differing in protocol, content, and output by level; sharing one knowledge core, Saudi cases, a unified measurement framework, and national ownership of data and the operating model.'},
   {'tick': 'teal', 'title': 'What starts first',
    'body': 'Adopt the four-level classification as the reference for registration and design; build the case library and the measurement framework before launching the first cohort.'},
   {'tick': 'green', 'title': 'What stays locally owned',
    'body': 'Saudi cases, participant data, measurement results, the operating model, local materials, and the relationship with government entities — under the contracts.'},
   {'tick': 'navy', 'title': 'How the model is reviewed',
    'body': 'Purchase, partnership, and licensing decisions for each level are revisited in light of the evidence that accumulates with each cohort.'}]},
 {'t': 'gap', 'h': 0.08},
 {'t': 'gpanel', 'paras': [("THE CLOSING COMMITMENT",
   "The value of this model remains contingent on continuous verification: it is a proposal built on published evidence as of the review date, and it is strengthened or amended by the measurement data recorded by the first cohorts — the data with which its design began.")]},
]},
]

# reference page headers (entries injected by build.py)
REF_HEADERS = {
 'kicker': 'REFERENCES',
 'h1': 'Section sources [1] – [71]',
 'lede': 'Numbered, evidence-tagged sources; links preserved as published in the source files, checked 21 August 2026. Tags: S statistics/survey · E independent evaluation · P provider announcement · R official record · N established press · I sponsor input · J analytical judgement · T indicative estimate.',
 'kicker_cont': 'REFERENCES — CONTINUED',
}
