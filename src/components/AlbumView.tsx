import { ArrowLeft, Play, Maximize2, Clock, Music2 } from 'lucide-react';
import { Track } from '../types';
import { useStore } from '../store';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlbumView({ albumId }: { albumId: string }) {
  const playlist = useStore((s) => s.playlists.find((p) => p.id === albumId));
  const tracks = useStore((s) => s.tracks);
  const setActiveAlbumId = useStore((s) => s.setActiveAlbumId);
  const playTrack = useStore((s) => s.playTrack);
  const setFullscreenMode = useStore((s) => s.setFullscreenMode);
  const currentTrackId = useStore((s) => s.currentTrackId);
  const isPlaying = useStore((s) => s.isPlaying);

  if (!playlist) return null;

  const albumTracks = playlist.tracks
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean) as Track[];

  const totalMin = Math.round(albumTracks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => setActiveAlbumId(null)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} />
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="flex gap-6 p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
        <div
          className="w-32 h-32 shrink-0 rounded-xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}
        >
          {playlist.artworkUrl && (
            <img
              src={playlist.artworkUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col justify-end min-w-0">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Playlist</span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1 truncate">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">{playlist.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2.5 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Music2 size={11} className="text-accent" /> {albumTracks.length} tracks</span>
            {totalMin > 0 && <span className="flex items-center gap-1.5"><Clock size={11} className="text-accent" /> {totalMin} min</span>}
          </div>
          {albumTracks.length > 0 && (
            <button
              onClick={() => playTrack(albumTracks[0].id)}
              className="mt-4 self-start flex items-center gap-2 px-4 py-2 bg-accent hover:brightness-90 text-black font-bold text-xs rounded-xl cursor-pointer transition-all shadow-[0_4px_15px_rgba(255,107,0,0.2)]"
            >
              <Play size={13} className="fill-current" style={{ transform: 'translateX(1px)' }} />
              Play All
            </button>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="space-y-0.5">
        {albumTracks.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-12">No tracks in this playlist.</p>
        ) : albumTracks.map((track, index) => {
          const isCurrent = currentTrackId === track.id;
          return (
            <div
              key={track.id}
              onClick={() => playTrack(track.id)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-accent/[0.07] border border-accent/20'
                  : 'border border-transparent hover:bg-white/[0.03] hover:border-white/[0.04]'
              }`}
            >
              {/* Index / playing bars */}
              <div className="w-6 flex items-center justify-center shrink-0">
                {isCurrent && isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3.5">
                    <div className="w-[2px] h-full bg-accent rounded-full animate-[pulse_0.8s_infinite]" style={{ animationDelay: '0.1s' }} />
                    <div className="w-[2px] h-[75%] bg-accent rounded-full animate-[pulse_0.6s_infinite]" style={{ animationDelay: '0.3s' }} />
                    <div className="w-[2px] h-[50%] bg-accent rounded-full animate-[pulse_0.9s_infinite]" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : (
                  <span className={`text-xs font-mono ${isCurrent ? 'text-accent' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Artwork */}
              <div
                className="w-10 h-10 shrink-0 rounded-lg overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}
              >
                {track.artworkUrl && (
                  <img
                    src={track.artworkUrl}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold truncate leading-tight ${isCurrent ? 'text-accent' : 'text-white'}`}>
                  {track.title}
                </p>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{track.artist}</p>
              </div>

              {/* Duration */}
              <span className="text-[11px] font-mono text-zinc-600 shrink-0 hidden sm:block tabular-nums">
                {fmt(track.duration)}
              </span>

              {/* Action buttons — appear on hover */}
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setFullscreenMode(true); playTrack(track.id); }}
                  title="Play + open visualizer"
                  className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-white/[0.05]"
                >
                  <Maximize2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
