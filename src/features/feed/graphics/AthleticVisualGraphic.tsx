import React from 'react';
import { ActivityView } from '../domain/activity';
import { BadmintonCourtCanvas } from './BadmintonCourtCanvas';
import { RunningRouteGraphic } from './RunningRouteGraphic';
import { WorkoutWaveGraphic } from './WorkoutWaveGraphic';

interface AthleticVisualGraphicProps {
  post: ActivityView;
  height?: number;
}

export const AthleticVisualGraphic: React.FC<AthleticVisualGraphicProps> = ({
  post,
  height = 120,
}) => {
  if (post.sportType === 'running') {
    return (
      <RunningRouteGraphic
        height={height}
        distanceKm={post.distanceKm ?? 5.2}
        pace={post.pace ?? '5:26'}
      />
    );
  }

  if (post.sportType === 'workout') {
    return (
      <WorkoutWaveGraphic
        height={height}
        avgHeartRate={post.avgHeartRate ?? 140}
      />
    );
  }

  const isPersonal = post.kind === 'personal';
  const wins = post.totals.wins ?? 0;
  const losses = post.totals.losses ?? 0;
  const hasPending = post.totals.pending > 0;

  return (
    <BadmintonCourtCanvas
      height={height}
      isPersonal={isPersonal}
      wins={wins}
      losses={losses}
      confirmed={post.totals.confirmed}
      hasPending={hasPending}
      matchScores={post.matchScores}
    />
  );
};

