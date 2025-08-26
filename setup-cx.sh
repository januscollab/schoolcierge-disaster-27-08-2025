#!/bin/bash

# Setup script for cx command
# This adds the cx command to your shell configuration

echo "🚀 Setting up 'cx' command for SchoolCierge..."

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CX_PATH="$PROJECT_DIR/cx"

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
   SHELL_CONFIG="$HOME/.zshrc"
   SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
   SHELL_CONFIG="$HOME/.bashrc"
   SHELL_NAME="bash"
else
   echo "Unsupported shell. Please add the following to your shell config manually:"
   echo "alias cx='$CX_PATH'"
   exit 1
fi

# Check if alias already exists
if grep -q "alias cx=" "$SHELL_CONFIG" 2>/dev/null; then
    echo "⚠️  'cx' alias already exists in $SHELL_CONFIG"
    echo "   Updating to new path..."
    # Remove old alias
    sed -i '' "/alias cx=/d" "$SHELL_CONFIG"
fi

# Add alias to shell config
echo "" >> "$SHELL_CONFIG"
echo "# SchoolCierge task management CLI" >> "$SHELL_CONFIG"
echo "alias cx='$CX_PATH'" >> "$SHELL_CONFIG"

echo "✅ Added 'cx' alias to $SHELL_CONFIG"
echo ""
echo "To start using 'cx' command, either:"
echo "  1. Open a new terminal window, or"
echo "  2. Run: source $SHELL_CONFIG"
echo ""
echo "Then try: cx help"
echo ""
echo "Quick examples:"
echo "  cx status          # Check project progress"
echo "  cx list            # List all tasks"
echo "  cx start TASK-001  # Start working on a task"
echo "  cx help            # Show all commands"