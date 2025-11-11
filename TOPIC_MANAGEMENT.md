# Topic Management Guide

This guide explains how to manage topics (tags) on the Withstain website, including creating new topics, renaming existing ones, and handling empty topics.

## Topic Data File

All topics are tracked in `src/_data/topicsMeta.json`. This file serves as the source of truth for topic metadata.

### Structure

```json
{
  "topic-slug": {
    "display": "Display Name",
    "description": "Brief description for the topic page"
  }
}
```

### Example

```json
{
  "longevity": {
    "display": "Longevity",
    "description": "Science-backed strategies for extending healthspan and lifespan"
  }
}
```

## Adding a New Topic

1. **Add to `topicsMeta.json`:**
   ```json
   {
     "new-topic-slug": {
       "display": "New Topic Name",
       "description": "Description that appears on the topic page"
     }
   }
   ```

2. **Use in blog posts:**
   Add the topic slug to the post's frontmatter:
   ```yaml
   ---
   title: "Post Title"
   tags:
     - new-topic-slug
     - other-topic
   ---
   ```

3. **Build the site:**
   Eleventy will automatically generate `/topics/new-topic-slug/` at build time.

## Renaming a Topic

When renaming a topic, you need to preserve SEO and user bookmarks with a redirect.

### Steps:

1. **Update `topicsMeta.json`:**
   ```json
   // Before
   {
     "old-name": {
       "display": "Old Name",
       "description": "..."
     }
   }

   // After
   {
     "new-name": {
       "display": "New Name",
       "description": "..."
     }
   }
   ```

2. **Add a redirect in `src/_redirects`:**
   ```
   /topics/old-name/ /topics/new-name/ 301
   ```

3. **Update all blog posts:**
   Find and replace the old tag slug with the new one in all post frontmatter:
   ```bash
   # Search for posts using the old tag
   grep -r "old-name" src/posts/
   ```

4. **Deploy:**
   Cloudflare Pages will automatically apply the redirects from `_redirects`.

### Example:

If renaming "nutrition-science" to "nutrition":

```
# In src/_redirects:
/topics/nutrition-science/ /topics/nutrition/ 301

# In src/_data/topicsMeta.json:
{
  "nutrition": {
    "display": "Nutrition",
    "description": "Evidence-based insights on diet and metabolic health"
  }
}

# Update all posts that used nutrition-science to use nutrition
```

## Handling Empty Topics

When a topic has no articles, the topic page automatically shows:

1. **Empty state message** with an icon
2. **All other available topics** as cards with:
   - Topic name and description
   - Article count
   - Links to those topics

This keeps users engaged even when landing on an empty topic page.

### To Remove a Topic Completely:

If you want to fully retire a topic:

1. **Remove from `topicsMeta.json`**
2. **Remove from all blog posts**
3. **Add a redirect to a related topic in `_redirects`:**
   ```
   /topics/old-topic/ /topics/related-topic/ 301
   ```

## Topic Pages

Topic pages are automatically generated at build time by Eleventy pagination. Each topic gets its own page at `/topics/{slug}/`.

### Features:

- **Custom descriptions** from `topicsMeta.json`
- **Fallback display names** if not in `topicsMeta.json` (auto-formatted from slug)
- **Post listing** with images, excerpts, and metadata
- **Empty state** with related topics when no posts exist
- **SEO-friendly** with proper structured data

## Best Practices

1. **Use descriptive slugs:** `stress-management` not `sm`
2. **Customize descriptions:** Auto-generated descriptions are basic, so update them in `topicsMeta.json` to be more compelling
3. **Keep topics broad enough:** Aim for 3+ articles per topic
4. **Use redirects:** Always redirect when renaming to preserve SEO
5. **Review after adding tags:** Check `topicsMeta.json` after adding new tags to posts and polish the auto-generated descriptions

## Automatic Tag Management

The build process automatically manages tags for you:

**During every build:**
- ✅ **Automatically adds** any tags used in posts to `topicsMeta.json`
- 🎯 **Auto-generates** display names and basic descriptions
- ℹ️ Reports tags registered but not used in any posts

**Example output:**
```
🏷️  Checking tags...

📊 Total posts scanned: 7
📊 Total unique tags in use: 15
📊 Total registered tags: 17

⚠️  Tags used in posts but missing from topicsMeta.json:

   • new-topic (3 posts) → Adding to topicsMeta.json

✅ Automatically added missing tags to topicsMeta.json
💡 Update the descriptions in src/_data/topicsMeta.json to customize them
```

**What happens automatically:**
1. You add a tag to a blog post: `tags: ['my-new-topic']`
2. Run build or dev server
3. Script detects the new tag
4. Adds it to `topicsMeta.json` with:
   - Display name: "My New Topic" (auto-formatted)
   - Description: "Articles and insights on my new topic" (placeholder)
5. You can customize the description later

**No manual work required!** Just use tags in your posts and they'll be registered automatically.

**Manual check:**
```bash
# Run the tag checker manually
node scripts/check-tags.js
```

## Checking Topic Usage

To see which topics are being used:

```bash
# See all topic pages generated
ls _site/topics/

# Count articles per topic
grep -h "^tags:" src/posts/*.md | sort | uniq -c
```

## Technical Details

- **Topic pages:** Generated by `src/topics.njk`
- **Styling:** `.topic-page`, `.related-topic-card` classes in `src/css/style.css`
- **Data source:** `src/_data/topicsMeta.json`
- **Redirects:** `src/_redirects` (copied to `_site/_redirects`)
- **Tag formatting:** `.eleventy.js` has a `formatTag` filter for display
