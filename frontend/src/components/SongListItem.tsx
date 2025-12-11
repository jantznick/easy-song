import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { SongListItemProps } from '../types/components';
import Card from './Card';

const SongListItem: FC<SongListItemProps> = ({ song }) => {
  return (
    <div className="group">
      <Link to={`/songs/${song.videoId}`} className="block h-full">
        <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 ease-out h-full flex flex-col hover:-translate-y-1 border-border/50 hover:border-primary/50">
            <div className="relative overflow-hidden rounded-t-2xl">
                <img 
                  src={song.thumbnailUrl} 
                  alt={song.title} 
                  className="w-full h-48 object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                    <div className="bg-primary rounded-full h-16 w-16 flex items-center justify-center shadow-2xl shadow-primary/50 backdrop-blur-sm border-2 border-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div className="p-5 lg:p-6 flex-grow flex flex-col justify-between">
              <div>
                <p className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-tight mb-2">
                  {song.title}
                </p>
                <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-200">
                  by <span className="font-medium">{song.artist}</span>
                </p>
              </div>
            </div>
        </Card>
      </Link>
    </div>
  );
};

export default SongListItem;
