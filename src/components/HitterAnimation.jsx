import { useEffect, useRef } from 'react';
import hitterVideo from '../assets/hitter.mp4';

/**
 * Plays hitter.mp4 with the green screen removed (canvas chroma-key),
 * composited on top of the submitted trash photo.
 */
export default function HitterAnimation({ backgroundUrl }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // willReadFrequently avoids repeated GPU→CPU readback penalties
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const drawFrame = () => {
      if (video.paused || video.ended) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = frame.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Remove green-screen pixels:
        // green channel must dominate both red and blue by at least 30 %
        if (g > 80 && g > r * 1.3 && g > b * 1.3) {
          d[i + 3] = 0; // transparent
        }
      }

      ctx.putImageData(frame, 0, 0);
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    const onMetadata = () => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
    };

    const onPlay = () => drawFrame();

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('play', onPlay);

    // Autoplay (muted, so browsers allow it)
    video.play().catch(() => {});

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('play', onPlay);
      video.pause();
    };
  }, []);

  return (
    /* Wrapper matches the preview image container used elsewhere */
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">

      {/* Submitted trash photo — background layer */}
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt="Recycled item"
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* Hidden video source */}
      <video
        ref={videoRef}
        src={hitterVideo}
        className="hidden"
        muted
        playsInline
        loop
      />

      {/* Canvas with green screen removed — overlay layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
