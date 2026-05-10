# Article Framework

This document is the enforceable specification for all articles written by Arvid's AI article writer. Every article must follow this structure, tone, and quality bar.

---

## Voice & Tone

- **Perspective**: Third-person when describing the product ("Arvid does X", "Arvid understands Y"). First-person plural ("we") sparingly when speaking as the team.
- **Register**: Authoritative and clear. Like a well-reasoned essay by someone who deeply understands both the problem and the product. Not a press release, not a listicle, not a blog post trying to go viral.
- **Vocabulary**: Plain language. No buzzwords, no filler words ("leverage", "synergy", "cutting-edge", "revolutionary", "game-changer"). Say what you mean directly.
- **Sentence rhythm**: Vary sentence length naturally. Mix short declarative sentences with longer explanatory ones. Let the prose flow. Monotonous sentence length is a sign of weak writing.
- **Active voice**: Always. "Arvid builds the knowledge graph" not "The knowledge graph is built by Arvid."
- **No exclamation marks**: Confidence doesn't need exclamation marks.

---

## Structure

Articles are written as **cohesive long-form essays**. They do NOT use markdown headings to break sections. The article flows as continuous prose with clear paragraph breaks between ideas.

### Article (type: 'article')

1. **Opening** (1-2 paragraphs) — Establish the problem space. Set context the reader recognizes. No preamble, no "In today's world..." — start with substance.
2. **Industry framing** (1-2 paragraphs) — What exists today. What other tools do. Why the current approach falls short. Be specific about the gap.
3. **Core thesis** (1-2 paragraphs) — How Arvid fundamentally differs. State the key insight clearly. This is the pivot point of the article.
4. **Deep explanation** (3-5 paragraphs) — Unpack the thesis with concrete specifics. How does Arvid actually work? Reference real capabilities: knowledge graphs, repository analysis, code awareness, connected tools (GitHub, Linear, Slack, Supabase), question generation, structured requirements. Use concrete examples — describe what happens when a user does something.
5. **Implications** (2-3 paragraphs) — What this means at organizational scale. Why it matters beyond the immediate feature. Connect to real problems: organizational amnesia, context loss, knowledge fragmentation, onboarding, decision tracing.
6. **Closing** (1 paragraph) — Land the argument cleanly. Restate the core distinction. No CTA. No "the future is bright." Just a sharp final thought.

### Feature (type: 'feature')

Short, focused product page about a **single feature**. Written to explain what the feature does and why it matters — not a tutorial, not a long essay. Think of a product marketing page that a potential user lands on from Google.

1. **Problem statement** (1 paragraph) — What user pain does this feature solve? Be specific and relatable.
2. **What it does** (1-2 paragraphs) — Describe the feature clearly. What happens when the user uses it?
3. **How it works** (2-3 paragraphs) — The mechanism. What does Arvid do under the hood? Use a concrete walkthrough.
4. **What makes it different** (1 paragraph) — Why is this better than alternatives? One sharp distinction.
5. **Result** (1 paragraph) — What does the user's world look like after using this?

### Docs (type: 'docs')

Technical how-to guide for a specific product capability. Written for developers and power users. Practical, direct, no marketing fluff.

1. **Overview** — What this feature is in one sentence.
2. **Prerequisites** — What the user needs before starting.
3. **Setup / Configuration** — Step-by-step instructions.
4. **Usage** — How to use it day-to-day with concrete examples.
5. **How it works** — Brief technical explanation of what happens behind the scenes.
6. **Tips & edge cases** — Limitations, gotchas, best practices.

---

## Formatting Rules

### Articles
- **No markdown headings**. Continuous prose.
- **Paragraphs**: 3-6 sentences each.
- **Lists**: Almost never. Prefer prose.
- **Length**: 1000-1800 words.

### Features
- **No markdown headings**. Continuous prose, like articles.
- **Paragraphs**: 2-4 sentences. Punchy and scannable.
- **Lists**: Only for concrete capability sets (max 3-4 items).
- **Length**: 400-700 words. Concise.

### Docs
- **Use markdown headings** (`##` for sections, `###` for subsections).
- **Numbered lists** for sequential steps, bullet lists for non-ordered items.
- **Code blocks** for configuration, API payloads, commands.
- **Second person**: "You can configure..." not "The user configures..."
- **Length**: 600-1200 words.

### All types
- **Paragraph breaks**: Separate every paragraph with a blank line.
- **Bold**: Key terms on first introduction. Use naturally.
- **Code**: Inline `` `code` `` for technical terms. Fenced blocks for multi-line examples.
- **Images**: Don't reference images. Added separately in the CMS.
- **Links**: Research citations only (added by AI via web search). No manual hyperlinks.

---

## Research & Citations

Arvid's article writer has web search available. Every article should be grounded in the broader industry conversation, not written in a vacuum.

- **Research first**: Before writing, search for 2-4 relevant sources on the topic — industry blog posts, engineering articles, research papers, or authoritative technical writing.
- **Weave references naturally**: Cite sources inline using markdown links as part of the prose. Don't dump a bibliography at the end.
- **Good**: "As Martin Fowler has argued in his writing on [evolutionary architecture](https://url), systems that preserve decision context age better."
- **Bad**: "Sources: [1] https://... [2] https://..."
- **Quality over quantity**: Only cite sources that genuinely strengthen the argument. Don't cite for the sake of citing.
- **Prefer authoritative sources**: Engineering blogs from respected companies (Stripe, GitHub, Netflix, Spotify, Shopify), well-known technical authors (Martin Fowler, Kelsey Hightower, Dan Abramov), peer-reviewed content, official documentation.
- **Never fabricate URLs**: Only cite URLs that actually exist.

---

## Catalog Awareness & Deduplication

Arvid's article writer receives the full catalog of existing articles before writing. This prevents repetition across hundreds of articles.

- **No repeated topics**: If an article already covers "why context matters more than tickets", a new article must not retread the same ground. Find a fresh angle or go deeper on a specific subtopic.
- **No repeated arguments**: If a previous article argued that "knowledge graphs beat flat backlogs", the new article must not make the same argument. It can reference it, build on it, or challenge it — but not restate it.
- **No repeated examples**: If a previous article used the OAuth implementation example, use a different concrete scenario.
- **Cross-reference where useful**: If a new article touches on a topic covered in depth by an existing article, reference it naturally ("As we explored in our earlier piece on knowledge graphs..."). This builds a connected body of work.
- **Expand the surface area**: Each article should cover territory no previous article has claimed. Over time, the catalog should map the full landscape of Arvid's value proposition without gaps or overlaps.

The existing article catalog is provided as structured data: title, type, excerpt, and tags. Use all of these signals to identify what's been covered and what remains unexplored.

---

## Content Rules

- **No fluff**: Every paragraph must advance the argument. No filler, no repetition, no padding.
- **Product grounding**: At least 40% of the article should reference specific Arvid capabilities grounded in what the product actually does.
- **Research grounding**: At least 2 external citations per article to place Arvid's approach in the broader engineering conversation.
- **Concrete examples**: Don't describe features abstractly. Show what happens: "Instead of asking 'Should authentication support multiple providers?', Arvid can ask whether the feature should extend the existing authentication abstraction in a specific directory."
- **Technical accuracy**: Never claim Arvid does something it doesn't. When describing future capabilities, use "will" clearly and sparingly.
- **Reader respect**: Assume the reader is a senior engineer, engineering manager, or technical leader. They know what a backlog is. Don't explain basics.
- **Shareability**: The article should be compelling enough that someone would share it with their team.

---

## Quality Bar

An article is ready for publication when:
1. A senior engineer would read it and think "that's well-written and insightful"
2. It makes a clear, specific argument that couldn't be written about any generic product
3. It grounds claims in concrete product capabilities, not abstract promises
4. Every paragraph advances the argument — removing any paragraph would create a noticeable gap
5. The prose flows naturally from start to finish without jarring transitions
