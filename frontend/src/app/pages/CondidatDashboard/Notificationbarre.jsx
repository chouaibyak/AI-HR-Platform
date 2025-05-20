import React from 'react'

export default function Notificationbarre({ onNotificationClick }) {
  return (
    <div className="absolute right-0 mt-2 w-72 bg-white rounded shadow-lg z-50 p-4">
      <p className="font-semibold text-gray-800 mb-5">Notifications</p>
      <ul className="text-sm text-gray-600 space-y-1">
        <li className="hover:bg-gray-100 px-2 py-1 mb-3 rounded cursor-pointer">✅ Nouvelle candidature reçue</li>
        <li className="hover:bg-gray-100 px-2 py-1 mb-3 rounded cursor-pointer">🔄 Mise à jour de l'offre #42</li>
        <li className="hover:bg-gray-100 px-2 py-1 mb-3 rounded cursor-pointer">💬 Nouveau message de Jean</li>
      </ul>
    </div>
  )
}
