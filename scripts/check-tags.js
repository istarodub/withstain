const fs = require('fs');
const path = require('path');
const glob = require('glob');
const matter = require('gray-matter');

/**
 * Scans all blog posts and checks if their tags are registered in tags.json
 * Shows warnings for missing tags and suggestions for tags.json
 */
function checkTags() {
  console.log('\n🏷️  Checking tags...\n');

  // Read topicsMeta.json
  const tagsJsonPath = path.join(__dirname, '../src/_data/topicsMeta.json');
  let registeredTags = {};

  try {
    registeredTags = JSON.parse(fs.readFileSync(tagsJsonPath, 'utf8'));
  } catch (error) {
    console.error('❌ Error reading topicsMeta.json:', error.message);
    return;
  }

  // Find all markdown posts
  const postsPattern = path.join(__dirname, '../src/posts/**/*.md');
  const postFiles = glob.sync(postsPattern);

  // Collect all tags from posts
  const tagsInUse = new Set();
  const tagUsageCount = {};

  postFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { data } = matter(content);

      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach(tag => {
          tagsInUse.add(tag);
          tagUsageCount[tag] = (tagUsageCount[tag] || 0) + 1;
        });
      }
    } catch (error) {
      console.warn(`⚠️  Error reading ${path.basename(file)}:`, error.message);
    }
  });

  // Find missing tags
  const missingTags = Array.from(tagsInUse).filter(tag => !registeredTags[tag]);
  const unusedTags = Object.keys(registeredTags).filter(tag => !tagsInUse.has(tag));

  // Report results
  console.log(`📊 Total posts scanned: ${postFiles.length}`);
  console.log(`📊 Total unique tags in use: ${tagsInUse.size}`);
  console.log(`📊 Total registered tags: ${Object.keys(registeredTags).length}\n`);

  // Missing tags (used in posts but not in topicsMeta.json)
  if (missingTags.length > 0) {
    console.log('⚠️  Tags used in posts but missing from topicsMeta.json:\n');

    let tagsAdded = false;

    missingTags.sort().forEach(tag => {
      const count = tagUsageCount[tag];
      const displayName = tag.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      console.log(`   • ${tag} (${count} post${count > 1 ? 's' : ''}) → Adding to topicsMeta.json`);

      // Add to registeredTags
      registeredTags[tag] = {
        display: displayName,
        description: `Articles and insights on ${displayName.toLowerCase()}`
      };
      tagsAdded = true;
    });

    // Write updated tags.json
    if (tagsAdded) {
      try {
        // Sort tags alphabetically
        const sortedTags = Object.keys(registeredTags).sort().reduce((acc, key) => {
          acc[key] = registeredTags[key];
          return acc;
        }, {});

        fs.writeFileSync(
          tagsJsonPath,
          JSON.stringify(sortedTags, null, 2) + '\n',
          'utf8'
        );
        console.log('\n✅ Automatically added missing tags to topicsMeta.json');
        console.log('💡 Update the descriptions in src/_data/topicsMeta.json to customize them\n');
      } catch (error) {
        console.error('\n❌ Error writing to topicsMeta.json:', error.message);
        console.log('\n💡 Manually add these to src/_data/topicsMeta.json:\n');
        missingTags.sort().forEach(tag => {
          console.log(`  "${tag}": {`);
          console.log(`    "display": "${registeredTags[tag].display}",`);
          console.log(`    "description": "${registeredTags[tag].description}"`);
          console.log(`  },`);
        });
        console.log('');
      }
    }
  }

  // Unused tags (in tags.json but not used in any posts)
  if (unusedTags.length > 0) {
    console.log('ℹ️  Tags registered but not used in any posts:\n');
    unusedTags.sort().forEach(tag => {
      console.log(`   • ${tag} (${registeredTags[tag].display})`);
    });
    console.log('\n💡 These tags will show empty topic pages until posts are added.\n');
  }

  // All good
  if (missingTags.length === 0 && unusedTags.length === 0) {
    console.log('✅ All tags are properly registered!\n');
  }

  // Summary
  console.log('─'.repeat(60));
  console.log('');
}

// Run if called directly
if (require.main === module) {
  checkTags();
}

module.exports = checkTags;
