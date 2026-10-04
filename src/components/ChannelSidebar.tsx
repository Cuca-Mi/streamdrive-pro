import React, { useState } from 'react';
import { Channel } from '../types';
import { CATEGORIES } from '../data/defaultChannels';
import {
  Search,
  Plus,
  Star,
  Tv,
  WifiOff,
  Flame,
  CheckCircle,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage';

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannel: Channel;
  onSelectChannel: (channel: Channel) => void;
  favorites: string[];
  onToggleFavorite: (channel: Channel) => void;
  onOpenAddModal: () => void;
  isOnline: boolean;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  selectedChannel,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  onOpenAddModal,
  isOnline,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChannels = channels.filter((ch) => {
    const matchesSearch =
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'Todos') return true;
    if (selectedCategory === 'Favoritos') return favorites.includes(ch.id);
    if (selectedCategory === 'Personalizados / Xtream') return ch.isCustom || ch.streamType === 'xtream';
    return ch.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <aside className="flex flex-col w-full h-full bg-neutral-900 border-r border-neutral-800 text-neutral-100 select-none">
      {/* Top Search & Add action */}
      <div className="p-3.5 border-b border-neutral-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar canal ou gênero..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onOpenAddModal}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center transition"
            title="Adicionar Canal ou Xtream URL"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-neutral-100 text-neutral-900 font-bold shadow-sm'
                  : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat === 'Favoritos' && <Star className="inline w-3 h-3 mr-1 fill-amber-400 text-amber-400" />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Offline Status Alert if offline */}
      {!isOnline && (
        <div className="px-3 py-2 bg-amber-950/80 border-b border-amber-600/40 text-[11px] text-amber-200 flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Modo Offline: exibindo canais em cache local.</span>
        </div>
      )}

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 p-2 space-y-1">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-neutral-500">
            <Tv className="w-10 h-10 mb-2 stroke-1 text-neutral-600" />
            <p className="text-xs font-semibold text-neutral-400">Nenhum canal encontrado</p>
            <p className="text-[11px] mt-1">Experimente outra categoria ou adicione sua URL Xtream no botão + acima.</p>
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const isSelected = selectedChannel.id === channel.id;
            const isFav = favorites.includes(channel.id);
            const isSavedOffline = offlineStorage.isChannelSavedOffline(channel.id);

            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition relative group ${
                  isSelected
                    ? 'bg-neutral-800/90 border border-indigo-500/40 shadow-md ring-1 ring-indigo-500/30'
                    : 'hover:bg-neutral-950/60 border border-transparent'
                }`}
              >
                {/* Channel Logo Thumbnail */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                  {channel.logoUrl ? (
                    <img src={channel.logoUrl} alt={channel.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <Tv className="w-5 h-5" />
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                      <Radio className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-indigo-400' : 'text-neutral-200 group-hover:text-white'
                      }`}
                    >
                      {channel.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                    <span className="truncate">{channel.category}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400">{channel.resolution || '1080p'}</span>
                    {isSavedOffline && (
                      <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-semibold flex items-center gap-0.5 text-[9px]">
                        💾 Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Favorite Star action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(channel);
                  }}
                  className={`p-1.5 rounded-xl transition ${
                    isFav
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-neutral-600 hover:text-neutral-300 opacity-60 group-hover:opacity-100'
                  }`}
                  title={isFav ? 'Remover dos favoritos' : 'Favoritar canal'}
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
