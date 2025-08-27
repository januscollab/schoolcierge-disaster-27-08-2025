#!/usr/bin/env node

const gradient = require('gradient-string');
const figlet = require('figlet');

// CREAITE brand colors
const tealGradient = gradient(['#008B8B', '#00CED1', '#40E0D0']);
const goldGradient = gradient(['#FFD700', '#FFA500', '#FFD700']);

function generateCreaiteLogo() {
  // Generate the full ASCII art
  const fullLogo = figlet.textSync('CREAITE', {
    font: 'Big',
    horizontalLayout: 'default',
  });
  
  // Split into lines
  const lines = fullLogo.split('\n');
  
  // For each line, color CRE in teal, AI in gold, TE in teal
  // This is a simplified approach - we'll color based on character positions
  const coloredLines = lines.map(line => {
    if (line.trim() === '') return line;
    
    // Rough character positions for "CREAITE" in Big font
    // CRE takes roughly 0-30 chars, AI takes 30-50, TE takes 50-end
    const cre = line.substring(0, 30);
    const ai = line.substring(30, 50);
    const te = line.substring(50);
    
    return tealGradient(cre) + goldGradient(ai) + tealGradient(te);
  });
  
  return coloredLines.join('\n');
}

// Alternative: Simple colored text approach
function generateSimpleCreaiteLogo() {
  // Generate each part separately and combine
  const creaPart = figlet.textSync('CRE', {
    font: 'Big',
    horizontalLayout: 'default',
  });
  
  const aiPart = figlet.textSync('AI', {
    font: 'Big',
    horizontalLayout: 'default',
  });
  
  const tePart = figlet.textSync('TE', {
    font: 'Big',
    horizontalLayout: 'default',
  });
  
  // Since we can't easily merge ASCII art, use the full logo with gradient
  // But apply teal to the whole thing, then manually highlight AI in output
  const fullLogo = figlet.textSync('CREAITE', {
    font: 'Big',
    horizontalLayout: 'default',
  });
  
  // Apply teal gradient to entire logo (gold highlighting would be manual)
  return tealGradient(fullLogo);
}

module.exports = {
  generateCreaiteLogo,
  generateSimpleCreaiteLogo,
  tealGradient,
  goldGradient
};