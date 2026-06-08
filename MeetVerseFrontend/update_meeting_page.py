import re

with open('src/Pages/Meetings/MeetingPage/MeetingPage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Imports
code = code.replace('FileDown } from "lucide-react";', 'FileDown, Link } from "lucide-react";')

# Navbar Logic
code = code.replace('const [meetingInfo, setMeetingInfo] = useState<Meeting | null>(null);', 'const [meetingInfo, setMeetingInfo] = useState<Meeting | null>(null);\n  const [isNavbarVisible, setIsNavbarVisible] = useState(false);')

code = code.replace('<Navbar />', '''<div 
        className={`absolute top-0 left-0 w-full z-50 transition-transform duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}
        onMouseEnter={() => setIsNavbarVisible(true)}
        onMouseLeave={() => setIsNavbarVisible(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md -z-10 h-[80px] pointer-events-none" style={{ opacity: isNavbarVisible ? 1 : 0, transition: 'opacity 0.3s' }} />
        <Navbar />
      </div>
      <div 
        className="absolute top-0 left-0 w-full h-[60px] z-40" 
        onMouseEnter={() => setIsNavbarVisible(true)}
      />''')

# Main container space
code = code.replace('<main className="flex-1 pt-20 pb-4', '<main className="flex-1 pt-6 pb-4')

# AI Shield Badge
code = code.replace('bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm', 'bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg')
code = code.replace('<ShieldCheck size={14} className="text-blue-600" />', '<div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />')
code = code.replace('text-blue-600 uppercase', 'text-slate-300 uppercase')

# Video Tile Outlines & Glow
code = code.replace('border-blue-500 ring-4 ring-blue-500/10', 'border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.4)] ring-4 ring-blue-500/20')
code = code.replace('border-white dark:border-[#2A2E3B]', 'border-white/5 dark:border-[#2A2E3B]')

# Video Tile Background
code = code.replace('bg-white dark:bg-[#181B26]', 'bg-gradient-to-br from-[#0f1117] to-[#1a1d2e]')

# Avatar
code = code.replace('rounded-full bg-gradient-to-br ${user.color}', 'rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white/10 shadow-lg shadow-black/40')

# Name tags
code = code.replace('bg-black/40 backdrop-blur-xl px-3 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-2xl z-20', 'bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20 shadow-lg z-20')
code = code.replace('bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl z-20', 'bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20 shadow-lg z-20')
code = code.replace('text-[10px] font-black text-white uppercase tracking-wider', 'text-xs font-semibold text-white tracking-wide')

# Mic status
code = code.replace('? "bg-emerald-400 shadow-[0_0_8px_#34d399]"\n                            : "bg-slate-400"', '? "bg-emerald-400 shadow-[0_0_8px_#34d399]"\n                            : (user.isLocal && muted) ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-slate-400/50"')

# Grid layout empty state
code = code.replace('<div className="flex items-center justify-center h-full overflow-hidden">\n                <div className="grid grid-cols-2 gap-3 md:gap-5 w-full h-full max-w-[1000px] max-h-[700px]">', '<div className="flex items-center justify-center h-full overflow-hidden relative">\n                {participants.length === 1 && (\n                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-[#0D0F16]/5 to-transparent blur-3xl animate-pulse -z-10 w-[800px] h-[800px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />\n                )}\n                <div className={`grid gap-3 md:gap-5 w-full h-full transition-all duration-500 z-10 ${participants.length === 1 ? "grid-cols-1 max-w-[800px] max-h-[600px]" : "grid-cols-2 max-w-[1000px] max-h-[700px]"}`}>')

# Footer waiting text
code = code.replace('))}              </div>            </div>          )}        </div>', '))}              </div>              {participants.length === 1 && (\n                <div className="absolute bottom-12 flex flex-col items-center z-20">\n                  <p className="text-slate-400 text-sm font-medium mb-3">Waiting for others to join...</p>\n                  <button \n                    onClick={() => {\n                      navigator.clipboard.writeText(window.location.href);\n                      try { showToast("Invite link copied to clipboard!", "success"); } catch(e) {}\n                    }}\n                    className="bg-white/5 hover:bg-white/10 px-5 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 border border-white/10 shadow-lg flex items-center gap-2"\n                  >\n                    <Link size={16} />\n                    Copy Invite Link\n                  </button>\n                </div>\n              )}            </div>          )}        </div>')

# Actually, the footer waiting text replace target might have formatting differences. Let's use re.sub for that.
# Find `</motion.div>\n                  ))}\n                </div>\n              </div>\n            )}`
# And replace
code = re.sub(r'</motion\.div>\s*?}\)\s*?}\s*?</div>\s*?</div>\s*?\)\s*?}', r'''</motion.div>
                  ))}
                </div>
                {participants.length === 1 && (
                  <div className="absolute bottom-12 flex flex-col items-center z-20">
                    <p className="text-slate-400 text-sm font-medium mb-3">Waiting for others to join...</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        try { showToast("Invite link copied to clipboard!", "success"); } catch(e) {}
                      }}
                      className="bg-white/5 hover:bg-white/10 px-5 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 border border-white/10 shadow-lg flex items-center gap-2"
                    >
                      <Link size={16} />
                      Copy Invite Link
                    </button>
                  </div>
                )}
              </div>
            )}''', code, count=1)

with open('src/Pages/Meetings/MeetingPage/MeetingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Update complete")
