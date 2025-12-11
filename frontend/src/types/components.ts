import type { ReactNode } from 'react';
import type { SongSummary } from './song';

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export interface SongListItemProps {
  song: SongSummary;
}
