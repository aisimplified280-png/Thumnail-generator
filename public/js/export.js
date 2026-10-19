// AI SIMPLIFIED LAB - EXPORT ENGINE
// Rasterizes SVG to high-resolution PNG / JPEG and exports vector SVG & JSON project specs.

window.StudioExport = (function() {
  'use strict';

  // Rasterize SVG string to an HTMLCanvasElement
  function rasterizeSvgToCanvas(svgString, width, height, scale = 1) {
    return new Promise((resolve, reject) => {
      const targetWidth = Math.round(width * scale);
      const targetHeight = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to rasterize SVG to canvas: ' + err));
      };

      img.src = url;
    });
  }

  // Trigger browser download of a blob
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Export as PNG
  async function exportPng(engine, filename = 'thumbnail.png', scale = 1, transparentBg = false) {
    const svgStr = engine.generateSvgString({ isExport: true, transparentBg });
    const canvas = await rasterizeSvgToCanvas(svgStr, engine.width, engine.height, scale);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        triggerDownload(blob, filename);
        resolve(true);
      }, 'image/png');
    });
  }

  // Export as JPEG
  async function exportJpeg(engine, filename = 'thumbnail.jpg', quality = 0.92, scale = 1) {
    const svgStr = engine.generateSvgString({ isExport: true, transparentBg: false });
    const canvas = await rasterizeSvgToCanvas(svgStr, engine.width, engine.height, scale);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        triggerDownload(blob, filename);
        resolve(true);
      }, 'image/jpeg', quality);
    });
  }

  // Export as SVG
  function exportSvg(engine, filename = 'thumbnail.svg', transparentBg = false) {
    const svgStr = engine.generateSvgString({ isExport: true, transparentBg });
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, filename);
    return Promise.resolve(true);
  }

  // Generate mini preview DataUrl for storage / recent projects view
  async function generateThumbnailPreview(engine) {
    try {
      const svgStr = engine.generateSvgString({ isExport: true, transparentBg: false });
      const scale = 320 / engine.width; // 320px wide preview
      const canvas = await rasterizeSvgToCanvas(svgStr, engine.width, engine.height, scale);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.warn('Could not generate preview:', e);
      return '';
    }
  }

  // Export project JSON
  function exportProjectJson(projectData, filename = 'project.json') {
    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, filename);
  }

  return {
    exportPng,
    exportJpeg,
    exportSvg,
    exportProjectJson,
    generateThumbnailPreview
  };
})();
