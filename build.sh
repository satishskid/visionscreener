#!/bin/bash

# Build script for Skids Vision
echo "🏗️  Building Skids Vision for deployment..."

# Create deployment directory
mkdir -p dist

# Copy all necessary files to dist
echo "📁 Copying files..."
cp index.html dist/
cp style.css dist/
cp app.js dist/
cp README.md dist/

# Optimize files for production (basic optimization)
echo "⚡ Optimizing for production..."

# Add basic minification markers (in a real setup, you'd use proper minifiers)
echo "/* Production build - $(date) */" > dist/build-info.css
cat dist/style.css >> dist/build-info.css
mv dist/build-info.css dist/style.css

echo "/* Production build - $(date) */" > dist/build-info.js
cat dist/app.js >> dist/build-info.js
mv dist/build-info.js dist/app.js

echo "✅ Build complete! Files ready in dist/ directory"
echo "🚀 Ready for deployment to Netlify"
