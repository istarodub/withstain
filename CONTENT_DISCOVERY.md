# Content Discovery System

This document explains how tools, blog posts, and topics are interconnected to create a seamless content discovery experience.

## Overview

The site uses a **bidirectional content discovery system**:
- **Blog posts → Tools**: Articles show CTAs for related tools
- **Tools → Topics**: Tool results link to relevant topic pages
- **Fallback**: Posts without related tools show newsletter subscription

## Data Structure

### File: `src/_data/toolTopicMappings.json`

This central mapping file defines relationships between tools and topics:

```json
{
  "tools": {
    "tool-id": {
      "name": "Tool Display Name",
      "description": "What the tool does",
      "url": "/tools/tool-path/",
      "relatedTopics": ["topic1", "topic2"],
      "ctaText": "Button text"
    }
  },
  "topicToTools": {
    "topic-slug": ["tool-id"],
    "topic-with-no-tool": []
  }
}
```

## How It Works

### 1. Blog Posts → Tool CTAs

**Location:** Individual blog post pages

**Logic:**
1. Check if any of the post's tags have related tools in `topicToTools`
2. If yes: Show prominent tool CTA with icon, description, and action button
3. If no: Show newsletter subscription block

**Example:**
- Post tagged with `longevity` → Shows "Longevity Habits Screener" CTA
- Post tagged with `osteoporosis` → Shows newsletter subscription (no tool yet)

**Implementation:** `src/_includes/post.njk` lines 50-81

### 2. Tools → Topic Pages

**Location:** Tool results pages (e.g., longevity screener)

**Logic:**
1. Each pillar feedback includes an `articleTag`
2. Links directly to `/topics/{tag}/` for deeper exploration
3. Uses topic metadata from `topicsMeta.json` for display

**Example:**
- Nutrition pillar → Links to `/topics/nutrition-science/`
- Exercise pillar → Links to `/topics/exercise/`

**Implementation:** `src/tools/longevity-screener.njk` lines 847-852

### 3. Related Posts

**Location:** Bottom of blog posts

**Logic:**
1. Custom `relatedPosts` filter scores posts by shared tags
2. Shows top 3 most related articles
3. Uses full blog card layout for consistency

**Implementation:**
- Filter: `.eleventy.js` lines 89-106
- Template: `src/_includes/post.njk` lines 84-124

## Adding New Tools

When adding a new tool:

1. **Create the tool page** in `src/tools/`

2. **Update `toolTopicMappings.json`:**
   ```json
   "tools": {
     "new-tool-id": {
       "name": "New Tool Name",
       "description": "Brief description for CTA",
       "url": "/tools/new-tool-id/",
       "relatedTopics": ["topic1", "topic2", "topic3"],
       "ctaText": "Take the Assessment"
     }
   }
   ```

3. **Map topics to the tool:**
   ```json
   "topicToTools": {
     "topic1": ["new-tool-id"],
     "topic2": ["new-tool-id", "existing-tool"]
   }
   ```

4. **In the tool results,** link to relevant topics using:
   ```html
   <a href="/topics/topic-slug/">Explore Topic articles</a>
   ```

## Content Discovery Flow

### User Journey Example:

1. **User reads blog post** on "Biological Age"
   - Post is tagged: `biological-age`, `longevity`, `aging-research`
   - See CTA: "Longevity Habits Screener" (matches `longevity` tag)

2. **User takes screener**
   - Gets personalized feedback on 5 pillars
   - Each pillar shows: "Explore [Topic] articles" link

3. **User clicks topic link**
   - Lands on `/topics/nutrition-science/`
   - Sees all nutrition-related articles
   - Each article has its own tool CTAs

4. **User reads another article**
   - Sees "Read Next" section at bottom
   - Discovers 3 related articles based on shared tags

5. **Cycle continues** with seamless discovery

## Visual Elements

### Tool CTA Design
- **Icon:** Material Icons `assessment`
- **Style:** Lime gradient background, prominent border
- **Layout:** Icon | Text | Button (horizontal on desktop, stacked on mobile)
- **Placement:** After post content, before "Read Next"

### Subscribe Fallback
- Uses existing `subscribe-block.njk` component
- Same visual weight as tool CTA
- Appears for posts without related tools

### Topic Links in Tools
- Consistent "Explore [Topic] articles" format
- Material Icons `arrow_forward`
- Links to `/topics/{slug}/`

## Benefits

1. **Engagement**: Readers discover relevant tools and content
2. **Conversion**: Strategic tool CTAs at point of interest
3. **SEO**: Internal linking strengthens topic clusters
4. **Flexibility**: Easy to add new tools and update mappings
5. **Fallback**: Newsletter capture when no tool exists

## Maintenance

**Regular tasks:**
- Update `toolTopicMappings.json` when adding tools
- Review topic mappings for relevance
- Add new topics to `topicToTools` with empty arrays initially
- Update tool descriptions to keep CTAs fresh

**When adding a blog post:**
- Use relevant tags from `topicsMeta.json`
- Tool CTAs appear automatically if mappings exist
- No manual CTA insertion needed
