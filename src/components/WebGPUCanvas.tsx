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
  const gridRef = useRef<PIXI.Graphics | null>(null);
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
      background: '#0B0F19',
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
    
    const zScale = 100;
    const rowHeight = 10;
    const pianoRollWidth = 40;

    if (!gridRef.current) {
      gridRef.current = new PIXI.Graphics();
      if (app.stage.addChildAt) {
          app.stage.addChildAt(gridRef.current, 0);
      } else {
          app.stage.addChild(gridRef.current);
      }
    }

    const grid = gridRef.current;
    grid.clear();

    const maxX = 2000;
    const maxY = 128 * rowHeight;

    // Cartesian Grid
    for (let x = pianoRollWidth; x < maxX; x += zScale) {
       grid.moveTo(x, 0);
       grid.lineTo(x, maxY);
       grid.stroke({ color: 0x334155, alpha: 0.5, width: 1 });
    }
    
    for (let y = 0; y < maxY; y += rowHeight) {
       grid.moveTo(pianoRollWidth, y);
       grid.lineTo(maxX, y);
       // Subtle line every row
       grid.stroke({ color: 0x334155, alpha: 0.2, width: 1 });
    }

    // Piano Roll Anchor (Left edge)
    const accidentals = new Set([1, 3, 6, 8, 10]); // Black keys in MIDI (relative to C)
    for (let i = 0; i < 128; i++) {
       const isAccidental = accidentals.has(i % 12);
       grid.rect(0, (127 - i) * rowHeight, pianoRollWidth, rowHeight);
       grid.fill({ color: isAccidental ? 0x0F172A : 0x1E293B });
    }

    const pool = poolRef.current;

    events.forEach((event, index) => {
      const { x, y, width } = calculateProjectionCoordinates(event, event.startTime, zScale, rowHeight);
      
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
      
      g.roundRect(x + pianoRollWidth, y, width, 8, 4);
      
      const isSynth = event.style === 'synth';
      const color = isSynth ? 0x10B981 : 0x3B82F6;
      g.fill({ color });
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
