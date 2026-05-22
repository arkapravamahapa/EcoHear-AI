#!/usr/bin/env bash
echo "Starting hard-locked installation..."
pip install --no-cache-dir -r requirements.txt
echo "Installing Gemini API forcefully..."
pip install --no-cache-dir google-generativeai
echo "Build complete."