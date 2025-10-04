import { execSync } from 'child_process';
import { features } from 'web-features';
import { readFileSync } from 'fs';

export async function lintCSS(filePath, options = {}) {
  const { baseline = 'all', verbose = false } = options;
  
  const result = {
    file: filePath,
    type: 'css',
    features: [],
    errors: [],
    warnings: [],
    info: []
  };

  try {
    // Read CSS file content
    const cssContent = readFileSync(filePath, 'utf-8');
    
    // Run csslint-baseline
    let cssLintOutput;
    try {
      cssLintOutput = execSync(`npx csslint-baseline "${filePath}"`, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error) {
      // csslint-baseline might return non-zero exit code
      cssLintOutput = error.stdout || '';
    }

    // Parse CSS features from content
    const detectedFeatures = await detectCSSFeatures(cssContent);
    
    for (const feature of detectedFeatures) {
      const featureData = features[feature.key];
      
      if (featureData) {
        const baselineStatus = featureData.status?.baseline;
        const featureInfo = {
          name: feature.key,
          displayName: featureData.name || feature.name,
          baseline: baselineStatus,
          line: feature.line,
          column: feature.column,
          property: feature.property,
          value: feature.value,
          description: featureData.description_html || featureData.description
        };

        result.features.push(featureInfo);

        // Categorize based on baseline status and filter
        if (shouldIncludeFeature(baselineStatus, baseline)) {
          const messageObj = {
            ...featureInfo,
            message: `CSS feature '${feature.property}${feature.value ? `: ${feature.value}` : ''}' is baseline ${getBaselineDescription(baselineStatus)}`,
            severity: getBaselineSeverity(baselineStatus)
          };

          switch (messageObj.severity) {
            case 'error':
              result.errors.push(messageObj);
              break;
            case 'warning':
              result.warnings.push(messageObj);
              break;
            default:
              result.info.push(messageObj);
          }
        }
      }
    }

    // Parse csslint-baseline output if available (disabled for now)
    // if (cssLintOutput && verbose) {
    //   console.log(`CSSlint baseline output for ${filePath}:`, cssLintOutput);
    // }

  } catch (error) {
    result.errors.push({
      message: `Failed to analyze CSS file: ${error.message}`,
      severity: 'error'
    });
  }

  return result;
}

async function detectCSSFeatures(cssContent) {
  const detectedFeatures = [];
  const lines = cssContent.split('\n');
  
  // Comprehensive CSS feature detection patterns
  const cssFeaturePatterns = [
    // Layout
    { pattern: /display:\s*grid/gi, key: 'css-grid', property: 'display', value: 'grid' },
    { pattern: /display:\s*flex/gi, key: 'css-flexbox', property: 'display', value: 'flex' },
    { pattern: /display:\s*contents/gi, key: 'display-contents', property: 'display', value: 'contents' },
    { pattern: /display:\s*subgrid/gi, key: 'css-subgrid', property: 'display', value: 'subgrid' },
    
    // Grid properties
    { pattern: /grid-template-columns/gi, key: 'css-grid', property: 'grid-template-columns' },
    { pattern: /grid-template-rows/gi, key: 'css-grid', property: 'grid-template-rows' },
    { pattern: /grid-template-areas/gi, key: 'css-grid', property: 'grid-template-areas' },
    { pattern: /grid-auto-flow/gi, key: 'css-grid', property: 'grid-auto-flow' },
    { pattern: /subgrid/gi, key: 'css-subgrid', property: 'subgrid' },
    
    // Flexbox properties
    { pattern: /flex-direction/gi, key: 'css-flexbox', property: 'flex-direction' },
    { pattern: /justify-content/gi, key: 'justify-content', property: 'justify-content' },
    { pattern: /align-items/gi, key: 'css-flexbox', property: 'align-items' },
    { pattern: /flex-wrap/gi, key: 'css-flexbox', property: 'flex-wrap' },
    
    // Gap property
    { pattern: /gap:/gi, key: 'gap', property: 'gap' },
    { pattern: /flexbox-gap/gi, key: 'flexbox-gap', property: 'gap' },
    
    // Transforms
    { pattern: /transform:/gi, key: 'css-transforms', property: 'transform' },
    { pattern: /transform-style/gi, key: 'transform-style', property: 'transform-style' },
    { pattern: /transform-origin/gi, key: 'css-transforms', property: 'transform-origin' },
    { pattern: /perspective/gi, key: 'transforms3d', property: 'perspective' },
    { pattern: /rotate3d|rotateX|rotateY|rotateZ|translate3d/gi, key: 'transforms3d', property: '3d-transforms' },
    
    // Transitions & Animations
    { pattern: /transition:/gi, key: 'css-transitions', property: 'transition' },
    { pattern: /transition-property/gi, key: 'css-transitions', property: 'transition-property' },
    { pattern: /transition-duration/gi, key: 'css-transitions', property: 'transition-duration' },
    { pattern: /animation:/gi, key: 'css-animations', property: 'animation' },
    { pattern: /animation-composition/gi, key: 'animation-composition', property: 'animation-composition' },
    { pattern: /@keyframes/gi, key: 'at-rule-keyframes', property: '@keyframes' },
    
    // Filters
    { pattern: /filter:/gi, key: 'filter', property: 'filter' },
    { pattern: /backdrop-filter:/gi, key: 'backdrop-filter', property: 'backdrop-filter' },
    
    // Gradients
    { pattern: /linear-gradient/gi, key: 'css-gradients', property: 'linear-gradient' },
    { pattern: /radial-gradient/gi, key: 'css-gradients', property: 'radial-gradient' },
    { pattern: /conic-gradient/gi, key: 'css-conic-gradients', property: 'conic-gradient' },
    
    // Custom Properties
    { pattern: /--[a-zA-Z-]+:/gi, key: 'css-variables', property: 'custom-properties' },
    { pattern: /var\(/gi, key: 'css-variables', property: 'var()' },
    
    // Container Queries
    { pattern: /container-type:/gi, key: 'container-queries', property: 'container-type' },
    { pattern: /container-name:/gi, key: 'container-queries', property: 'container-name' },
    { pattern: /@container/gi, key: 'container-queries', property: '@container' },
    
    // Cascade Layers
    { pattern: /@layer/gi, key: 'cascade-layers', property: '@layer' },
    
    // CSS Nesting
    { pattern: /&:/gi, key: 'css-nesting', property: 'nesting' },
    { pattern: /&\s*\./gi, key: 'css-nesting', property: 'nesting' },
    
    // Math Functions
    { pattern: /calc\(/gi, key: 'calc', property: 'calc()' },
    { pattern: /min\(/gi, key: 'css-math-functions', property: 'min()' },
    { pattern: /max\(/gi, key: 'css-math-functions', property: 'max()' },
    { pattern: /clamp\(/gi, key: 'css-math-functions', property: 'clamp()' },
    
    // Color Functions
    { pattern: /hsl\(/gi, key: 'color', property: 'hsl()' },
    { pattern: /hwb\(/gi, key: 'color', property: 'hwb()' },
    { pattern: /lab\(/gi, key: 'color', property: 'lab()' },
    { pattern: /lch\(/gi, key: 'color', property: 'lch()' },
    { pattern: /color-mix\(/gi, key: 'color-mix', property: 'color-mix()' },
    { pattern: /color\(/gi, key: 'color-function', property: 'color()' },
    
    // Aspect Ratio
    { pattern: /aspect-ratio:/gi, key: 'aspect-ratio', property: 'aspect-ratio' },
    
    // Logical Properties
    { pattern: /margin-inline/gi, key: 'css-logical-props', property: 'margin-inline' },
    { pattern: /padding-block/gi, key: 'css-logical-props', property: 'padding-block' },
    { pattern: /border-inline/gi, key: 'css-logical-props', property: 'border-inline' },
    { pattern: /inset-inline/gi, key: 'css-logical-props', property: 'inset-inline' },
    
    // Scroll Features
    { pattern: /scroll-snap-type/gi, key: 'scroll-snap', property: 'scroll-snap-type' },
    { pattern: /scroll-behavior/gi, key: 'scroll-behavior', property: 'scroll-behavior' },
    { pattern: /scroll-padding/gi, key: 'scroll-padding', property: 'scroll-padding' },
    { pattern: /scroll-margin/gi, key: 'scroll-margin', property: 'scroll-margin' },
    { pattern: /overscroll-behavior/gi, key: 'overscroll-behavior', property: 'overscroll-behavior' },
    { pattern: /overflow-anchor/gi, key: 'overflow-anchor', property: 'overflow-anchor' },
    
    // Position
    { pattern: /position:\\s*sticky/gi, key: 'css-position-sticky', property: 'position', value: 'sticky' },
    
    // Containment
    { pattern: /contain:/gi, key: 'css-contain', property: 'contain' },
    { pattern: /content-visibility/gi, key: 'content-visibility', property: 'content-visibility' },
    { pattern: /contain-intrinsic-size/gi, key: 'contain-intrinsic-size', property: 'contain-intrinsic-size' },
    
    // Text Features
    { pattern: /text-wrap/gi, key: 'css-text-wrap', property: 'text-wrap' },
    { pattern: /hyphens/gi, key: 'css-hyphens', property: 'hyphens' },
    { pattern: /text-decoration-thickness/gi, key: 'text-decoration-thickness', property: 'text-decoration-thickness' },
    { pattern: /text-underline-offset/gi, key: 'text-underline-offset', property: 'text-underline-offset' },
    { pattern: /text-emphasis/gi, key: 'text-emphasis', property: 'text-emphasis' },
    
    // Font Features
    { pattern: /font-display/gi, key: 'font-display', property: 'font-display' },
    { pattern: /font-palette/gi, key: 'font-palette', property: 'font-palette' },
    { pattern: /font-variation-settings/gi, key: 'font-variation-settings', property: 'font-variation-settings' },
    { pattern: /font-optical-sizing/gi, key: 'font-optical-sizing', property: 'font-optical-sizing' },
    
    // User Interaction
    { pattern: /user-select/gi, key: 'css-user-select', property: 'user-select' },
    { pattern: /pointer-events/gi, key: 'pointer-events', property: 'pointer-events' },
    { pattern: /resize:/gi, key: 'css-resize', property: 'resize' },
    { pattern: /caret-color/gi, key: 'caret-color', property: 'caret-color' },
    { pattern: /accent-color/gi, key: 'accent-color', property: 'accent-color' },
    
    // Appearance
    { pattern: /appearance/gi, key: 'appearance', property: 'appearance' },
    
    // Scrollbars
    { pattern: /scrollbar-width/gi, key: 'scrollbar-width', property: 'scrollbar-width' },
    { pattern: /scrollbar-color/gi, key: 'scrollbar-color', property: 'scrollbar-color' },
    { pattern: /scrollbar-gutter/gi, key: 'scrollbar-gutter', property: 'scrollbar-gutter' },
    
    // Masks & Shapes
    { pattern: /mask:/gi, key: 'css-masks', property: 'mask' },
    { pattern: /shape-outside/gi, key: 'shape-outside', property: 'shape-outside' },
    { pattern: /shape-margin/gi, key: 'shape-margin', property: 'shape-margin' },
    { pattern: /clip-path/gi, key: 'css-shapes', property: 'clip-path' },
    
    // Motion Path
    { pattern: /offset-path/gi, key: 'css-motion-paths', property: 'offset-path' },
    { pattern: /offset-distance/gi, key: 'offset-distance', property: 'offset-distance' },
    { pattern: /offset-rotate/gi, key: 'offset-rotate', property: 'offset-rotate' },
    
    // Blend Modes
    { pattern: /mix-blend-mode/gi, key: 'mix-blend-mode', property: 'mix-blend-mode' },
    
    // Viewport Units
    { pattern: /\d+vw/gi, key: 'viewport-units', property: 'vw' },
    { pattern: /\d+vh/gi, key: 'viewport-units', property: 'vh' },
    { pattern: /\d+svh/gi, key: 'viewport-percentage-units-small', property: 'svh' },
    { pattern: /\d+lvh/gi, key: 'viewport-percentage-units-large', property: 'lvh' },
    { pattern: /\d+dvh/gi, key: 'viewport-percentage-units-dynamic', property: 'dvh' },
    
    // At-rules
    { pattern: /@supports/gi, key: 'at-rule-supports', property: '@supports' },
    { pattern: /@media/gi, key: 'at-rule-media', property: '@media' },
    { pattern: /@import/gi, key: 'at-rule-import', property: '@import' },
    { pattern: /@font-face/gi, key: 'at-rule-font-face', property: '@font-face' },
    { pattern: /@font-palette-values/gi, key: 'at-rule-font-palette-values', property: '@font-palette-values' },
    { pattern: /@counter-style/gi, key: 'at-rule-counter-style', property: '@counter-style' },
    { pattern: /@page/gi, key: 'at-rule-page', property: '@page' },
    { pattern: /@property/gi, key: 'at-rule-property', property: '@property' },
    
    // Pseudo-classes
    { pattern: /:has\(/gi, key: 'css-has', property: ':has()' },
    { pattern: /:is\(/gi, key: 'is', property: ':is()' },
    { pattern: /:where\(/gi, key: 'where', property: ':where()' },
    { pattern: /:not\(/gi, key: 'css-not-sel-list', property: ':not()' },
    { pattern: /:focus-visible/gi, key: 'focus-visible', property: ':focus-visible' },
    
    // Pseudo-elements
    { pattern: /::marker/gi, key: 'css-marker-pseudo', property: '::marker' },
    { pattern: /::selection/gi, key: 'css-selection', property: '::selection' },
    { pattern: /::placeholder/gi, key: 'css-placeholder', property: '::placeholder' },
    { pattern: /::backdrop/gi, key: 'pseudo-element-backdrop', property: '::backdrop' },
    { pattern: /::first-letter/gi, key: 'css-first-letter', property: '::first-letter' },
    { pattern: /::first-line/gi, key: 'css-first-line', property: '::first-line' },
    
    // Media Query Features
    { pattern: /prefers-color-scheme/gi, key: 'css-media-prefers-color-scheme', property: 'prefers-color-scheme' },
    { pattern: /prefers-reduced-motion/gi, key: 'css-media-prefers-reduced-motion', property: 'prefers-reduced-motion' },
    { pattern: /prefers-contrast/gi, key: 'prefers-contrast', property: 'prefers-contrast' },
    { pattern: /color-gamut/gi, key: 'color-gamut', property: 'color-gamut' },
    { pattern: /scripting/gi, key: 'css-media-scripting', property: 'scripting' },
    
    // Experimental Features
    { pattern: /anchor-name/gi, key: 'css-anchor-positioning', property: 'anchor-name' },
    { pattern: /position-anchor/gi, key: 'css-anchor-positioning', property: 'position-anchor' },
    { pattern: /view-transition-name/gi, key: 'view-transitions', property: 'view-transition-name' }
  ];

  lines.forEach((line, lineIndex) => {
    cssFeaturePatterns.forEach(({ pattern, key, property, value }) => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach(match => {
        detectedFeatures.push({
          key,
          name: property,
          property,
          value: value || extractCSSValue(line, match.index),
          line: lineIndex + 1,
          column: match.index + 1
        });
      });
    });
  });

  return detectedFeatures;
}

function extractCSSValue(line, startIndex) {
  const colonIndex = line.indexOf(':', startIndex);
  if (colonIndex === -1) return '';
  
  const semicolonIndex = line.indexOf(';', colonIndex);
  const endIndex = semicolonIndex === -1 ? line.length : semicolonIndex;
  
  return line.substring(colonIndex + 1, endIndex).trim();
}

function getBaselineDescription(baseline) {
  switch (baseline) {
    case 'high': return 'widely available';
    case 'low': return 'newly available';
    case false: return 'limited availability';
    default: return 'unknown status';
  }
}

function getBaselineSeverity(baseline) {
  switch (baseline) {
    case false: return 'error';
    case 'low': return 'warning';
    case 'high': return 'info';
    default: return 'info';
  }
}

function shouldIncludeFeature(baseline, filter) {
  if (filter === 'all') return true;
  return baseline === filter || (filter === 'false' && baseline === false);
}