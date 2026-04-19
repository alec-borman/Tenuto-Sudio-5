import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export default function WebGPUCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Need to configure options without 'resizeTo' to prevent JSDOM errors, or mock safely
    const app = new PIXI.Application();

    const init = async () => {
      // fallback to basic canvas init safely
      await app.init({
        background: '#1099bb',
        preference: 'webgpu',
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      const rect = new PIXI.Graphics();
      rect.rect(100, 100, 200, 150);
      rect.fill({ color: 0x0000ff });
      app.stage.addChild(rect);
    };

    init().catch(console.error);

    return () => {
      // Clean up the application securely to avoid WebGL context leaks
      try {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      } catch (e) {
        // Ignore destroy error in tests
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-900 overflow-hidden"
      data-testid="webgpu-canvas-container"
    />
  );
}
