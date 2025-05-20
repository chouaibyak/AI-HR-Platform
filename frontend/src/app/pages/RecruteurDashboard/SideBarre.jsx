import React from 'react'
import {
  Home,
  Briefcase,
  Users,
  Handshake,
  UserCheck,
  Contact,
  Calendar,
  Inbox,
  BarChart3,
  Network,
  Settings
} from 'lucide-react'

export default function SideBarre({ onNavigate }) {
  return (
    <div className='fixed h-screen border shadow-accent w-65 p-3.5 bg-white py-17'>
      {/* First group */}
      <ul>
        <li onClick={() => onNavigate("homme")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Home size={18} /> Home</li>
        <li onClick={() => onNavigate("jobs")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Briefcase size={18} /> Jobs</li>
        <li onClick={() => onNavigate("candidates")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Users size={18} /> Candidates</li>
      </ul>

      {/* Second group */}
      <ul className='mt-4 border-t'>
        <li onClick={() => onNavigate("matches")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Handshake size={18} /> Matches</li>
        <li onClick={() => onNavigate("placements")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><UserCheck size={18} /> Placements</li>
        <li onClick={() => onNavigate("contacts")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Contact size={18} /> Contacts and Guests</li>
        <li onClick={() => onNavigate("activities")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Calendar size={18} /> Activities</li>
        <li onClick={() => onNavigate("inbox")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Inbox size={18} /> Inbox</li>
      </ul>

      {/* Third group */}
      <ul className='mt-4 border-t'>
        <li onClick={() => onNavigate("reports")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><BarChart3 size={18} /> Reports</li>
        <li onClick={() => onNavigate("sourcing")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Network size={18} /> Sourcing Hub</li>
        <li onClick={() => onNavigate("settings")} className='flex items-center gap-2 p-2 w-full hover:bg-gray-100 cursor-pointer'><Settings size={18} /> Settings</li>
      </ul>
    </div>
  )
}
