import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Sparkles, Check, Disc } from 'lucide-react';
import { useStore } from '../store';

export default function UploadModal() {
  const addCustomUpload = useStore((state) => state.addCustomUpload);
  const setActiveTab = useStore((state) => state.setActiveTab);

  const [dragActive, setDragActive] = useState(false);
  const [fileAdded, setFileAdded] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Synthwave');
  const [artworkUrl, setArtworkUrl] = useState('');
  const [uploadingProgress, setUploadingProgress] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please upload a valid audio file (.mp3, .wav, .m4a, etc.)');
      return;
    }
    setFileAdded(file);
    // Auto populate details from name
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const parts = nameWithoutExt.split('-');
    if (parts.length > 1) {
      setArtist(parts[0].trim());
      setTitle(parts.slice(1).join('-').trim());
    } else {
      setArtist('Self Created');
      setTitle(nameWithoutExt);
    }

    // Auto assign a default stunning aesthetic cover based on Math.random
    const coverPresets = [
      'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'
    ];
    setArtworkUrl(coverPresets[Math.floor(Math.random() * coverPresets.length)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileAdded || !title) return;

    // Simulate high-fidelity Electron network upload sequence
    setUploadingProgress(0);
    const interval = setInterval(() => {
      setUploadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Generate an active browser stream url
          const audioUrl = URL.createObjectURL(fileAdded);
          
          // Add to store
          addCustomUpload(
            title,
            artist || 'Creator Incognito',
            genre,
            245, // Default length simulation
            audioUrl,
            artworkUrl
          );

          // Reset forms and go to home feed
          setTimeout(() => {
            setUploadingProgress(-1);
            setFileAdded(null);
            setTitle('');
            setArtist('');
            setActiveTab('home');
          }, 800);
          return 100;
        }
        return prev + 25;
      });
    }, 450);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Title & Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <UploadCloud className="text-accent animate-pulse" />
          <span>Electron Local Stream Injection</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Inject files directly into the EchoCloud client layer. The metadata will be parsed and registered automatically inside the player registry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Upload Container Zone */}
        <div className="md:col-span-7 flex flex-col h-full">
          <form 
            onSubmit={handleSubmit}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl h-72 px-4 text-center transition-all ${dragActive ? 'border-accent bg-accent/5' : 'border-white/10 bg-neutral-900/30'} ${fileAdded ? 'border-emerald-500/30 bg-emerald-500/[0.01]' : ''}`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden" 
            />

            {uploadingProgress >= 0 ? (
              <div className="flex flex-col items-center justify-center p-6 w-full">
                <Disc className="w-14 h-14 text-accent animate-spin mb-4" />
                <span className="text-sm font-semibold tracking-tight">Encrypting & Buffering Stream...</span>
                <span className="text-xs text-zinc-500 font-mono mt-1">{uploadingProgress}% completed</span>
                
                {/* Progress pipe */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4 max-w-xs">
                  <div 
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${uploadingProgress}%` }}
                  />
                </div>
              </div>
            ) : !fileAdded ? (
              <div className="flex flex-col items-center justify-center cursor-pointer p-6" onClick={triggerInputClick}>
                <div className="w-14 h-14 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} className="text-zinc-400 group-hover:text-accent" />
                </div>
                <span className="text-sm font-semibold tracking-tight mb-1 text-white">Drag & drop lossless audio file</span>
                <span className="text-xs text-zinc-500 font-mono">Supports MP3, WAV, FLAC, AAC up to 100MB</span>
                <button 
                  type="button" 
                  className="mt-4 px-4 py-1.5 bg-[#181818] hover:bg-[#202020] border border-white/5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 w-full">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check size={24} className="text-emerald-400" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white mb-1 truncate max-w-xs">{fileAdded.name}</span>
                <span className="text-xs text-emerald-400 font-mono font-semibold">Ready for Client Inlay</span>
                <button 
                  type="button"
                  onClick={() => setFileAdded(null)}
                  className="mt-4 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-md text-[10px] font-mono cursor-pointer"
                >
                  Remove File
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Form Meta details Grid */}
        <div className="md:col-span-5 flex flex-col justify-between p-5 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-accent" />
              <span>METADATA ENCODER</span>
            </h3>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono tracking-wider">TRACK TITLE</label>
              <input
                type="text"
                required
                disabled={!fileAdded || uploadingProgress >= 0}
                placeholder={fileAdded ? "Enter track name" : "Upload file first"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-8.5 px-3 bg-white/[0.03] border border-white/5 text-xs rounded-lg mt-1 focus:outline-none focus:border-accent/40 disabled:opacity-45"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono tracking-wider">ARTIST / COLLECTIVE</label>
              <input
                type="text"
                disabled={!fileAdded || uploadingProgress >= 0}
                placeholder="Self"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full h-8.5 px-3 bg-white/[0.03] border border-white/5 text-xs rounded-lg mt-1 focus:outline-none focus:border-accent/40 disabled:opacity-45"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono tracking-wider">ECHO GENRE INDEX</label>
              <select
                disabled={!fileAdded || uploadingProgress >= 0}
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full h-8.5 px-2 bg-zinc-900 border border-white/5 text-xs rounded-lg mt-1 focus:outline-none focus:border-accent/40 disabled:opacity-45 text-zinc-200"
              >
                <option value="Synthwave">Synthwave</option>
                <option value="Outrun">Outrun</option>
                <option value="Retrowave">Retrowave</option>
                <option value="Lo-Fi Chill">Lo-Fi Chill</option>
                <option value="Ambient Cosmic">Ambient Cosmic</option>
                <option value="Liquid DnB">Liquid DnB</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!fileAdded || !title || uploadingProgress >= 0}
            className="w-full py-2.5 bg-accent disabled:opacity-40 text-black hover:brightness-90 font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(255,107,0,0.15)] mt-6 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileAudio size={14} />
            <span>Mount to client</span>
          </button>
        </div>
      </div>
    </div>
  );
}
