import React from 'react';
import type { NoteInputEvent, VideoLesson } from '../../types';
import { Sheet } from '../shell/Sheet';
import { InteractiveVideoPlayer } from '../video/InteractiveVideoPlayer';

export interface IntroVideoSheetProps {
  open: boolean;
  video: VideoLesson | null;
  heldMidis: number[];
  lastNote: NoteInputEvent | null;
  onClose(): void;
  onWatched(videoId: string): void;
  onPlayNote(midi: number, velocity?: number, durationSec?: number): void;
  onPlayChord(midis: number[], velocity?: number, durationSec?: number): void;
  onKeyDown(midi: number, velocity?: number): void;
  onKeyUp(midi: number): void;
}

export const IntroVideoSheet: React.FC<IntroVideoSheetProps> = ({
  open,
  video,
  heldMidis,
  lastNote,
  onClose,
  onWatched,
  onPlayNote,
  onPlayChord,
  onKeyDown,
  onKeyUp,
}) => (
  <Sheet open={open && !!video} title={video?.title ?? ''} onClose={onClose} size="full">
    {video && (
      <InteractiveVideoPlayer
        video={video}
        currentlyHeldMidis={heldMidis}
        lastNoteInput={lastNote}
        onPlayNote={onPlayNote}
        onPlayChord={onPlayChord}
        onNoteOn={onKeyDown}
        onNoteOff={onKeyUp}
        onCompleteCheckpoint={onWatched}
      />
    )}
  </Sheet>
);

export default IntroVideoSheet;
