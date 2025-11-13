const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const checkTags = require("./scripts/check-tags");

module.exports = function(eleventyConfig) {
  // Run tag check after build
  eleventyConfig.on('eleventy.after', () => {
    checkTags();
  });
  // Configure markdown with anchor plugin for TOC
  const markdownLib = markdownIt({
    html: true,
    breaks: false,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: false,
    slugify: (s) => s.trim().toLowerCase().replace(/[\s+~\/]/g, '-').replace(/[().`,%·'"!?¿:@*]/g, '')
  });
  eleventyConfig.setLibrary("md", markdownLib);

  // Copy assets to output
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/videos");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/og-image.png");
  eleventyConfig.addPassthroughCopy("src/twitter-image.png");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/_redirects");

  // Add date filter
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Add dateToFormat filter for ISO dates
  eleventyConfig.addFilter("dateToFormat", (dateObj, format) => {
    const date = new Date(dateObj);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Add date filter for sitemap and structured data (ISO 8601 format with timezone)
  eleventyConfig.addFilter("date", (dateObj) => {
    const date = new Date(dateObj);
    return date.toISOString();
  });

  // Add getYear filter for copyright year
  eleventyConfig.addFilter("getYear", (dateObj) => {
    return new Date(dateObj || Date.now()).getFullYear();
  });

  // Add excerpt filter (first 150 characters)
  eleventyConfig.addFilter("excerpt", (content) => {
    const excerpt = content.substring(0, 150);
    return excerpt + (content.length > 150 ? "..." : "");
  });

  // Add filter to format tags (remove dashes, capitalize)
  eleventyConfig.addFilter("formatTag", (tag) => {
    if (!tag) return '';
    return tag.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  // Add reading time filter
  eleventyConfig.addFilter("readingTime", (content) => {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    const wordCount = text.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  });

  // Add truncate filter
  eleventyConfig.addFilter("truncate", (text, length) => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  });

  // Add related posts filter
  eleventyConfig.addFilter("relatedPosts", (allPosts, currentUrl, currentTags, limit = 3) => {
    if (!currentTags || currentTags.length === 0) return [];

    const related = allPosts
      .filter(post => post.url !== currentUrl && post.data.tags)
      .map(post => {
        const sharedTags = post.data.tags.filter(tag => currentTags.includes(tag));
        return {
          post: post,
          score: sharedTags.length
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return related;
  });

  // Add posts collection
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/**/*.md");
  });

  // Add TOC filter to extract headings from content
  eleventyConfig.addFilter("generateTOC", (content, pageTitle) => {
    if (!content) return [];

    const headingRegex = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gi;
    const toc = [];
    let match;
    let isFirstHeading = true;

    while ((match = headingRegex.exec(content)) !== null) {
      const id = match[1];
      const text = match[2].replace(/<[^>]*>/g, ''); // Strip HTML tags

      // Skip first H2 if it matches the page title
      if (isFirstHeading && pageTitle && text.trim() === pageTitle.trim()) {
        isFirstHeading = false;
        continue;
      }
      isFirstHeading = false;

      toc.push({
        level: 2,
        id: id,
        text: text
      });
    }

    return toc;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};
