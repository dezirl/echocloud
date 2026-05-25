import { Home, Search, Heart, ListMusic, Download, Settings, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../i18n';
import EchoCloudLogo from './EchoCloudLogo';

export default function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const userSession = useStore((s) => s.userSession);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const setCollapsed = useStore((s) => s.setSidebarCollapsed);
  const setActiveArtistId = useStore((s) => s.setActiveArtistId);
  const t = useT();

  const menuItems = [
    { id: 'home',      label: t.nav.home,      icon: Home      },
    { id: 'search',    label: t.nav.search,    icon: Search    },
    { id: 'likes',     label: t.nav.likes,     icon: Heart     },
    { id: 'playlists', label: t.nav.playlists, icon: ListMusic },
    { id: 'downloads', label: t.nav.downloads, icon: Download  },
    { id: 'settings',  label: t.nav.settings,  icon: Settings  },
  ];

  return (
    <>
      {/* Sidebar panel */}
      <div
        className="relative flex flex-col h-full acrylic-sidebar shrink-0 z-40 border-r border-white/[0.04] overflow-hidden"
        style={{
          width: collapsed ? 0 : 240,
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          borderRightWidth: collapsed ? 0 : 1,
        }}
      >
        <div
          className="flex flex-col h-full w-[240px]"
          style={{ opacity: collapsed ? 0 : 1, pointerEvents: collapsed ? 'none' : 'auto', transition: 'opacity 0.15s ease' }}
        >
          {/* Brand */}
          <div className="p-4 flex items-center h-16 border-b border-[#ffffff07]">
            <EchoCloudLogo showText className="w-10 h-6 shrink-0" />
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {menuItems.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative w-full flex items-center gap-3.5 py-2.5 px-3.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left cursor-pointer ${
                    active
                      ? 'bg-accent/10 border border-accent/20 text-white'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                  )}
                  <Icon size={20} className={active ? 'text-accent' : 'text-current'} />
                  <span className="whitespace-nowrap overflow-hidden" style={{ maxWidth: 140 }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Profile */}
          <div className="border-t border-white/[0.05] bg-white/[0.01]">
            <div
              className={`flex items-center gap-3 px-4 py-4 transition-colors ${
                userSession.isAuthenticated && userSession.scUserId
                  ? 'cursor-pointer hover:bg-white/[0.06]'
                  : ''
              }`}
              onClick={() => {
                if (userSession.isAuthenticated && userSession.scUserId) {
                  setActiveArtistId(userSession.scUserId);
                }
              }}
              title={userSession.isAuthenticated ? 'View my profile' : undefined}
            >
              <div className="relative shrink-0">
                <img
                  src={userSession.avatarUrl}
                  alt=""
                  className={`w-10 h-10 rounded-full border object-cover ${userSession.isAuthenticated ? 'border-accent/40' : 'border-white/10'}`}
                  referrerPolicy="no-referrer"
                />
                {userSession.isAuthenticated && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[14px] font-semibold text-white truncate">{userSession.username}</span>
                <span className="text-[10px] text-white/30 font-mono truncate">v1.2.0-alpha</span>
              </div>
              {userSession.isAuthenticated && userSession.scUserId && (
                <User size={15} className="text-zinc-600 shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapse toggle — rendered OUTSIDE the sidebar so overflow:hidden never clips it */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`fixed flex items-center justify-center top-[18px] w-7 h-7 bg-[#141414] hover:bg-[#1e1e1e] border rounded-full z-50 cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-lg ${
          collapsed ? 'border-accent/30 text-accent' : 'border-white/10 text-zinc-400'
        }`}
        style={{
          left: collapsed ? 12 : 240 - 28 - 6,
          transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </>
  );
}
