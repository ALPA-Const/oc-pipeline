import { useState } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  HelpCircle,
  Bot,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Bell,
  MessageSquare,
  BookOpen,
  Headphones,
} from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get display name (use email prefix if no name)
  const getDisplayName = () => {
    if (user?.email) {
      return user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return 'User';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OC</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">Pipeline</span>
          </div>
        </div>

        {/* Center: Project Search */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, documents, RFIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          {/* AI Assistant Button */}
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
            title="AI Assistant"
          >
            <Bot className="h-4 w-4" />
            <span className="hidden md:inline text-sm font-medium">AI Assistant</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            
            {showHelpMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHelpMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Help & Support</h3>
                  </div>
                  <button
                    onClick={() => { navigate('/help/guides'); setShowHelpMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">User Guides</div>
                      <div className="text-xs text-gray-500">Step-by-step tutorials</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { navigate('/help/support'); setShowHelpMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Headphones className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Contact Support</div>
                      <div className="text-xs text-gray-500">Get help from our team</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { navigate('/help/feedback'); setShowHelpMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Send Feedback</div>
                      <div className="text-xs text-gray-500">Help us improve</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
              </div>
              {/* Name */}
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">{getDisplayName()}</div>
                <div className="text-xs text-gray-500">O'Neill Contractors</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{getUserInitials()}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{getDisplayName()}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/settings/profile'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </button>
                  </div>
                  
                  {/* Sign Out */}
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Panel (slides in from right) */}
      {showAIAssistant && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowAIAssistant(false)} />
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">AI Assistant</h2>
                  <p className="text-xs text-gray-500">Powered by Elite AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-700">
                  👋 Hi! I'm your AI Assistant. I can help you with:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Finding projects and documents</li>
                  <li>• Generating reports</li>
                  <li>• Answering questions about your data</li>
                  <li>• Automating repetitive tasks</li>
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg">
                  <Bot className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
