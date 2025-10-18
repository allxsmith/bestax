const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const crypto = require('crypto');

/**
 * Docusaurus plugin to preprocess blog posts for dev.to publishing
 * Generates markdown files with production URLs including content hashes
 */
module.exports = function devtoPreprocessor(context, options) {
  return {
    name: 'devto-preprocessor',

    async postBuild({ siteConfig, routesPaths, outDir }) {
      console.log('🚀 Processing blog posts for dev.to...');

      const blogDir = path.join(context.siteDir, 'blog');
      const outputDir = path.join(outDir, '.devto-publish');
      const manifestPath = path.join(outDir, 'asset-manifest.json');
      const siteUrl = siteConfig.url || 'https://bestax.io';

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Read the webpack manifest to get hashed asset URLs
      let assetManifest = {};
      if (fs.existsSync(manifestPath)) {
        assetManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      }

      // Build image map from build output
      const imageMap = buildImageMap(outDir, siteUrl);

      // Process each blog post
      const blogPosts = await findBlogPosts(blogDir);

      for (const postPath of blogPosts) {
        await processBlogPost(postPath, blogDir, outputDir, imageMap, siteUrl);
      }

      console.log(`✅ Processed ${blogPosts.length} blog posts for dev.to`);
      console.log(`📁 Output directory: ${outputDir}`);
    },
  };
};

/**
 * Build a map of original image names to their hashed production URLs
 */
function buildImageMap(buildDir, siteUrl) {
  const imageMap = new Map();
  const assetsDir = path.join(buildDir, 'assets', 'images');

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);

    files.forEach(file => {
      // Extract original name from hashed filename
      // Format: original-name-hash.ext -> original-name.ext
      const match = file.match(/^(.+)-([a-f0-9]{32})(\.[^.]+)$/);
      if (match) {
        const originalName = match[1] + match[3];
        const hashedUrl = `${siteUrl}/assets/images/${file}`;
        imageMap.set(originalName, hashedUrl);

        // Also store without extension for flexible matching
        imageMap.set(match[1], hashedUrl);
      }
    });
  }

  return imageMap;
}

/**
 * Find all markdown blog posts
 */
async function findBlogPosts(blogDir) {
  const posts = [];

  function scanDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Check for index.md in folder
        const indexPath = path.join(fullPath, 'index.md');
        if (fs.existsSync(indexPath)) {
          posts.push(indexPath);
        }
        // Recurse into subdirectories
        scanDir(fullPath);
      } else if (item.isFile() && item.name.endsWith('.md')) {
        posts.push(fullPath);
      }
    }
  }

  scanDir(blogDir);
  return posts;
}

/**
 * Process a single blog post
 */
async function processBlogPost(
  postPath,
  blogDir,
  outputDir,
  imageMap,
  siteUrl
) {
  const content = fs.readFileSync(postPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Skip if not marked for dev.to
  if (!frontmatter.publish_to_devto) {
    return;
  }

  console.log(`  📝 Processing: ${path.basename(postPath)}`);

  // Remove the publish_to_devto flag
  const devtoFrontmatter = { ...frontmatter };
  delete devtoFrontmatter.publish_to_devto;

  // Get the blog post's date and slug from path
  const postDir = path.dirname(postPath);
  const postDirName = path.basename(postDir);
  const dateSlugMatch = postDirName.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);

  let blogUrlPath = '';
  if (dateSlugMatch) {
    const [, year, month, day, slug] = dateSlugMatch;
    blogUrlPath = `blog/${year}/${month}/${day}/${slug}`;
  }

  // Process the markdown body
  let processedBody = body;

  // Convert relative image paths to production URLs
  processedBody = processedBody.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src) => {
      // Handle different types of image references
      if (src.startsWith('http')) {
        // Already absolute URL
        return match;
      } else if (src.startsWith('./')) {
        // Relative to blog post
        const imageName = path.basename(src);
        const hashedUrl = findHashedUrl(
          imageName,
          imageMap,
          blogUrlPath,
          siteUrl
        );
        return `![${alt}](${hashedUrl})`;
      } else if (src.startsWith('/')) {
        // Relative to site root
        if (src.startsWith('/img/')) {
          // Static images (not hashed)
          return `![${alt}](${siteUrl}${src})`;
        } else {
          // Try to find hashed version
          const imageName = path.basename(src);
          const hashedUrl = findHashedUrl(
            imageName,
            imageMap,
            blogUrlPath,
            siteUrl
          );
          return `![${alt}](${hashedUrl})`;
        }
      }
      return match;
    }
  );

  // Process cover_image in frontmatter
  if (devtoFrontmatter.cover_image) {
    if (!devtoFrontmatter.cover_image.startsWith('http')) {
      if (devtoFrontmatter.cover_image.startsWith('./')) {
        const imageName = path.basename(devtoFrontmatter.cover_image);
        devtoFrontmatter.cover_image = findHashedUrl(
          imageName,
          imageMap,
          blogUrlPath,
          siteUrl
        );
      } else if (devtoFrontmatter.cover_image.startsWith('/')) {
        if (devtoFrontmatter.cover_image.startsWith('/img/')) {
          devtoFrontmatter.cover_image = `${siteUrl}${devtoFrontmatter.cover_image}`;
        } else {
          const imageName = path.basename(devtoFrontmatter.cover_image);
          devtoFrontmatter.cover_image = findHashedUrl(
            imageName,
            imageMap,
            blogUrlPath,
            siteUrl
          );
        }
      }
    }
  }

  // Process the image field (Docusaurus meta image)
  if (devtoFrontmatter.image) {
    if (!devtoFrontmatter.image.startsWith('http')) {
      if (devtoFrontmatter.image.startsWith('/img/')) {
        // Use this as cover_image if not set
        if (!devtoFrontmatter.cover_image) {
          devtoFrontmatter.cover_image = `${siteUrl}${devtoFrontmatter.image}`;
        }
      }
    }
    // Remove the image field as it's Docusaurus-specific
    delete devtoFrontmatter.image;
  }

  // Create the final markdown content
  const finalContent = matter.stringify(processedBody, devtoFrontmatter);

  // Write to output directory
  const outputFileName = path.basename(postPath);
  const outputPath = path.join(outputDir, outputFileName);
  fs.writeFileSync(outputPath, finalContent);

  console.log(`    ✅ Created: ${outputFileName}`);
}

/**
 * Find the hashed URL for an image
 */
function findHashedUrl(imageName, imageMap, blogUrlPath, siteUrl) {
  // First try exact match
  if (imageMap.has(imageName)) {
    return imageMap.get(imageName);
  }

  // Try without extension
  const nameWithoutExt = path.basename(imageName, path.extname(imageName));
  if (imageMap.has(nameWithoutExt)) {
    return imageMap.get(nameWithoutExt);
  }

  // If not found in hashed assets, construct the expected URL
  // This handles images that might be in the blog folder structure
  if (blogUrlPath) {
    return `${siteUrl}/${blogUrlPath}/${imageName}`;
  }

  // Fallback to static image path
  return `${siteUrl}/img/${imageName}`;
}
