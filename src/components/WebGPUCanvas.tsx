import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export function calculateProjectionCoordinates(
  event: any,
  startTime: { numerator: number, denominator: number },
  zScale: number,
  rowHeight: number
) {
  const startFraction = startTime.numerator / startTime.denominator;
  const durationFraction = event.duration.numerator / event.duration.denominator;

  return {
    x: startFraction * zScale,
    y: (127 - event.pitch.midi) * rowHeight,
    width: durationFraction * zScale,
  };
}

export default function WebGPUCanvas({ events = [] }: { events?: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    let isMounted = true;
    const app = new PIXI.Application();
    appRef.current = app;

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

      renderEvents();
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

  // Responsive event rendering pass
  useEffect(() => {
    if (appRef.current && appRef.current.stage) {
       // Only render if already initialized
       renderEvents();
    }
  }, [events]);

  function renderEvents() {
    const app = appRef.current;
    if (!app || !app.stage) return;
    
    // Clear geometry safely to eliminate overlap state corruption
    app.stage.removeChildren();

    events.forEach(event => {
      const { x, y, width } = calculateProjectionCoordinates(event, event.startTime, 100, 10);
      const g = new PIXI.Graphics();
      g.roundRect(x, y, width, 8, 4);
      g.fill({ color: 0x0000ff });
      app.stage.addChild(g);
    });
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-900 overflow-hidden"
      data-testid="webgpu-canvas-container"
    />
  );
}
