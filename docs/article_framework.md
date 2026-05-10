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

Same essay format but the deep explanation is 60%+ of the article. Open with the user problem this feature solves.

### Docs (type: 'docs')

Direct instructional format: what it is, how to use it, configuration options, examples. Written for developers. Headings are allowed for docs.

---

## Formatting Rules

- **No markdown headings** in article or feature types. The article reads as continuous prose. Headings are only allowed in docs.
- **Paragraphs**: 3-6 sentences each. Long enough to develop an idea fully, short enough to stay focused. Every paragraph should feel like a complete thought.
- **Paragraph breaks**: Separate every paragraph with a blank line. This is critical for readability.
- **Bold**: Use `**bold**` for key terms on first introduction and for emphasis on critical concepts. Use naturally, not excessively.
- **Code**: Use inline `` `code` `` for technical terms, file names, or commands when relevant. Use fenced code blocks for multi-line examples.
- **Lists**: Almost never in articles. Prefer prose. If absolutely necessary, max 3 items.
- **Links**: Reference Arvid concepts by name. Don't add hyperlinks — those are added editorially later.
- **Images**: Don't reference images. Article images are added separately in the CMS.
- **Length**: Target 1000-1800 words. Longer is fine if every paragraph earns its place. Never pad to hit a word count, but don't artificially truncate a well-flowing argument either.

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
