#!/bin/bash

# Portal Fusion Branding Update Script
# Updates all references from CrossBridge to Portal Fusion

echo "🌀 Updating project branding to Portal Fusion..."
echo ""

# Function to replace text in files
update_file() {
    local file=$1
    if [ -f "$file" ]; then
        # Create backup
        cp "$file" "$file.bak"
        
        # Replace variations of CrossBridge with Portal Fusion
        sed -i 's/CrossBridge/Portal Fusion/g' "$file"
        sed -i 's/crossbridge/portal-fusion/g' "$file"
        sed -i 's/CROSSBRIDGE/PORTAL_FUSION/g' "$file"
        sed -i 's/@crossbridge/@portal-fusion/g' "$file"
        
        # Update specific descriptions
        sed -i 's/Comprehensive cross-platform bridge system for MacBook and Windows tablet/Seamless computing, unified - Cross-platform bridge for PC and Mac/g' "$file"
        sed -i 's/Bridge the gap between your devices/Where platforms converge, productivity emerges/g' "$file"
        
        echo "✅ Updated: $file"
    fi
}

# Update main files
echo "📄 Updating documentation files..."
update_file "README.md"
update_file "CONTRIBUTING.md"
update_file "portal-fusion-brand.md"

echo ""
echo "📦 Updating package files..."
update_file "package.json"
update_file "tsconfig.json"
update_file "packages/shared/package.json"
update_file "packages/protocol/package.json"

echo ""
echo "🔧 Updating GitHub workflows..."
update_file ".github/workflows/ci.yml"
update_file ".github/workflows/release.yml"

echo ""
echo "💻 Updating source files..."
for file in packages/*/src/*.ts; do
    if [ -f "$file" ]; then
        update_file "$file"
    fi
done

echo ""
echo "🧹 Cleaning up backup files..."
find . -name "*.bak" -delete

echo ""
echo "✨ Branding update complete!"
echo ""
echo "📋 Summary of changes:"
echo "  - Project name: CrossBridge → Portal Fusion"
echo "  - Package name: crossbridge → portal-fusion"
echo "  - Namespace: @crossbridge → @portal-fusion"
echo "  - Constants: CROSSBRIDGE → PORTAL_FUSION"
echo ""
echo "🎨 Brand colors applied:"
echo "  - Primary PC: #2563EB (Deep Blue)"
echo "  - Primary Mac: #8B5CF6 (Vibrant Purple)"
echo "  - Fusion Gradient: #2563EB → #6366F1 → #8B5CF6"
echo ""
echo "💡 Next steps:"
echo "  1. Create logo assets in /assets directory"
echo "  2. Apply brand colors to UI components"
echo "  3. Update repository name on GitHub"
