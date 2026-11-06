import React from 'react';
import type { PracticeSessionSnapshot, ScoreData } from '../../types';
import { GrandStaffView } from '../visualizers/GrandStaffView';
import { FallingNotesCanvas } from '../visualizers/FallingNotesCanvas';
import { OverheadHandGuide } from '../visualizers/OverheadHandGuide';
import type { TargetNote } from './types';

export interface StaffPanelProps {
  score: ScoreData;
  snapshot: PracticeSessionSnapshot;
  /** Single-note score for Find the keys. */
  isDiscovery?: boolean;
  targets: TargetNote[];
  troubleMeasures: number[];
  showFalling: boolean;
  scale?: number;
  onPracticeBar?(measureIndex: number): void;
}

/**
 * GrandStaffView already scrolls itself to keep the playhead in view, so this panel only
 * sizes it and adds the optional falling-notes and hand-guide strips.
 */
export const StaffPanel: React.FC<StaffPanelProps> = ({
  score,
  snapshot,
  isDiscovery,
  targets,
  troubleMeasures,
  showFalling,
  scale = 0.72,
  onPracticeBar,
}) => {
  const handTargets = targets
    .filter((t) => t.hand && t.finger)
    .map((t) => ({ midi: t.midi, hand: t.hand!, finger: t.finger!, noteName: t.noteName }));

  return (
    <div className="flex flex-col rounded-panel overflow-hidden border border-ink-primary/10">
      <GrandStaffView
        hideHeader
        scale={scale}
        score={score}
        currentBeat={isDiscovery ? 0 : snapshot.currentBeat}
        noteStatuses={isDiscovery ? undefined : snapshot.noteStatuses}
        activeTargetMidis={snapshot.activeTargetMidis}
        hintedMidis={snapshot.hintedMidis}
        handFilter={isDiscovery ? 'both' : snapshot.handFilter}
        loopRange={isDiscovery ? null : snapshot.loopRange}
        troubleMeasures={isDiscovery ? [] : troubleMeasures}
        showNoteNames={snapshot.showNoteNames}
        showFingerNumbers={snapshot.showFingerNumbers}
        className="!border-b-0"
        onSelectMeasure={isDiscovery ? undefined : onPracticeBar}
      />
      {showFalling && !isDiscovery && (
        <div className="relative h-[112px] border-t border-ink-primary/10">
          <FallingNotesCanvas
            score={score}
            currentBeat={snapshot.currentBeat}
            noteStatuses={snapshot.noteStatuses}
            currentlyHeldMidis={snapshot.currentlyHeldMidis}
            activeTargetMidis={snapshot.activeTargetMidis}
            hintedMidis={snapshot.hintedMidis}
            wrongPlayedMidis={snapshot.wrongPlayedMidis}
            handFilter={snapshot.handFilter}
            loopRange={snapshot.loopRange}
            showNoteNames={snapshot.showNoteNames}
            showFingerNumbers={snapshot.showFingerNumbers}
            className="w-full h-full"
          />
        </div>
      )}
      {snapshot.showOverheadHands && (
        <div className="relative h-24 border-t border-ink-primary/10 overflow-hidden">
          <OverheadHandGuide
            score={score}
            currentBeat={isDiscovery ? 0 : snapshot.currentBeat}
            activeNotes={handTargets}
            hintedMidis={snapshot.hintedMidis}
            handFilter={snapshot.handFilter}
            visible
            className="!bg-transparent !border-0 h-full"
          />
        </div>
      )}
    </div>
  );
};

export default StaffPanel;
