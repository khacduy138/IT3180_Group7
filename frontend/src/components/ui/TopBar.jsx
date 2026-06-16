import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import {Input} from './Input';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import { Settings, Bell, SidebarOpen, SidebarClose, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function TopBar({ onToggleSidebar, sidebarOpen }) {
    const userRole = localStorage.getItem('userRole') || '';
    const username = localStorage.getItem('username') || 'User';
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:3001/api/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (_) {
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            navigate('/login');
        }
    };

    const avatarInitial = username.charAt(0).toUpperCase();

    return (
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background px-6 h-16 grid grid-cols-4 text-foreground">
            <div className=" flex items-center gap-4 justify-start">
                <span className="text-xl font-black min-w-12"><span className="text-primary">B</span>MS</span>
                <Button 
                    size="icon" 
                    variant="outline"
                    onClick={onToggleSidebar}
                    aria-label="Toggle Sidebar"
                    className="" 
                    >
                    {sidebarOpen ? <SidebarClose className="h-5 w-5" /> : <SidebarOpen className="h-5 w-5" />}
                </Button>
                <Input placeholder="Tìm kiếm công cụ..." className="w-48" />
            </div>
            <div className="col-span-2" />
            <div className=" flex items-center justify-end gap-4">
                <Bell className="cursor-pointer" />
                <Settings
                    className="cursor-pointer"
                    onClick={() => navigate('/settings')}
                />
                <div className="relative" ref={dropdownRef}>
                    <Avatar
                        className="cursor-pointer"
                        onClick={() => setDropdownOpen(prev => !prev)}
                    >
                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                        <AvatarFallback>{avatarInitial}</AvatarFallback>
                    </Avatar>

                    {dropdownOpen && (
                        <div className="absolute right-0 top-12 z-50 w-48 rounded-md border border-border bg-background shadow-lg">
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-semibold text-foreground truncate">{username}</p>
                                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                            </div>
                            <div className="p-1">
                                <button
                                    onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <User size={14} />
                                    Hồ sơ cá nhân
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut size={14} />
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

