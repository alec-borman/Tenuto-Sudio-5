import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export default function WebGPUCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const app = new PIXI.Application();

    // 1. The Async Lock: Store the promise returned by app.init()
    const initPromise = app.init({
      background: '#1099bb',
      preference: 'webgpu',
    }).catch((e) => {
      // Ignore initial render rejection in test environments
      console.error(e);
    });

    initPromise.then(() => {
      // 3. DOM Safety: Only append if the component is still mounted after resolution
      if (!isMounted) return;

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      const rect = new PIXI.Graphics();
      rect.rect(100, 100, 200, 150);
      rect.fill({ color: 0x0000ff });
      app.stage.addChild(rect);
    }).catch(console.error);

    return () => {
      isMounted = false;
      // 2. The Deferred Destruction: Await initPromise before calling destroy
      initPromise.then(() => {
        try {
          app.destroy(true, { children: true, texture: true, baseTexture: true });
        } catch (e) {
          // Ignore destroy error in tests
        }
      });
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
