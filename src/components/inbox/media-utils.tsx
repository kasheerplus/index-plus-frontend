'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Download, Volume2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    if (!src) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
                <X className="h-6 w-6" />
            </button>
            <img
                src={src}
                alt={alt}
                className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300"
            />
        </div>
    );
}

export function AudioPlayer({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-brand-off-white rounded-xl min-w-[200px] border border-brand-beige">
            <audio ref={audioRef} src={src} preload="metadata" />

            <button
                onClick={togglePlay}
                className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-full text-white transition-all shadow-lg active:scale-95 shrink-0",
                    isPlaying ? "bg-brand-blue" : "bg-brand-green"
                )}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
                <div className="h-1.5 bg-brand-blue-alt/10 rounded-full overflow-hidden w-full">
                    <div
                        className="h-full bg-brand-green transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] font-black text-brand-blue-alt/40 font-number">
                    <span>{formatTime(duration * (progress / 100))}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}
