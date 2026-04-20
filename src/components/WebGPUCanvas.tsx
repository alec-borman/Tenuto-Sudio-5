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

export default function WebGPUCanvas({ events = [], onMutation, onSelect }: { events?: any[], onMutation?: (eventData: any, deltaX: number) => void, onSelect?: (nodeData: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const poolRef = useRef<PIXI.Graphics[]>([]);
  const onMutationRef = useRef(onMutation);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onMutationRef.current = onMutation;
    onSelectRef.current = onSelect;
  }, [onMutation, onSelect]);

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
    
    const pool = poolRef.current;

    events.forEach((event, index) => {
      const { x, y, width } = calculateProjectionCoordinates(event, event.startTime, 100, 10);
      
      let g: PIXI.Graphics;

      if (index < pool.length) {
        g = pool[index];
        g.clear();
        g.visible = true;
        g.renderable = true;
      } else {
        g = new PIXI.Graphics();
        g.eventMode = 'dynamic';
        g.cursor = 'col-resize';
        
        g.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
          (g as any)._dragging = true;
          (g as any)._startX = e.global.x;
        });

        g.on('globalpointermove', (e: PIXI.FederatedPointerEvent) => {
          if (!(g as any)._dragging) return;
        });

        g.on('pointerup', (e: PIXI.FederatedPointerEvent) => {
          if (!(g as any)._dragging) return;
          (g as any)._dragging = false;
          
          const deltaX = e.global.x - (g as any)._startX;
          if (deltaX !== 0 && onMutationRef.current) {
            onMutationRef.current((g as any).linkedEvent, deltaX);
          }
        });

        g.on('pointertap', (e: PIXI.FederatedPointerEvent) => {
          if (onSelectRef.current) {
            onSelectRef.current((g as any).linkedEvent);
          }
        });

        pool.push(g);
        app.stage.addChild(g);
      }

      // Safe state mapping preventing closure leaks across identical geometries over time
      (g as any).linkedEvent = event;
      
      g.roundRect(x, y, width, 8, 4);
      g.fill({ color: 0x0000ff });
    });

    // Submerge surplus pools seamlessly resolving deletions 
    for (let i = events.length; i < pool.length; i++) {
        pool[i].visible = false;
        pool[i].renderable = false;
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-900 overflow-hidden"
      data-testid="webgpu-canvas-container"
    />
  );
}
