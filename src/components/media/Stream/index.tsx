import React, { useEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

export type StreamProps = {
  /** What is shown live: a camera, a shared screen, another side of a call. Nothing is drawn while it is null. */
  stream: MediaStream | null;
  /** Turned left to right, as a mirror shows you: the viewer's own camera. */
  mirrored?: boolean;
  /** Its sound off (the default: the viewer's own camera must never play back to them). */
  muted?: boolean;
  /** What it is, for assistive tech ("Your camera"). */
  label?: string;
  className?: string;
};

/**
 * A live picture, the one place the kit shows a camera or a screen. It fills whatever holds it (a Frame gives it its
 * shape and corners), covers it, and plays at once without sound or controls of its own.
 */
export const Stream = ({ stream, mirrored = false, muted = true, label, className }: StreamProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} className={cn(styles.stream, mirrored && styles.mirrored, className)} autoPlay playsInline muted={muted} aria-label={label} />;
};
