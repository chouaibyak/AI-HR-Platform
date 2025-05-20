import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import api from "@/app/services/api/api";
import { auth } from "@/app/firebase";
import { signOutUser } from "@/app/services/auth";
import { useNavigate } from 'react-router-dom';

export default function ProfilMenu({ onProfileClick }) {

  const [profil, setProfil] = useState(null)
  const navigate = useNavigate()

  const getUserProfil = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const res = await api.get('/me');
        console.log(res.data);
        setProfil(res.data);
      } else {
        console.error("Utilisateur non connecté");
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  useEffect(() => {
    getUserProfil()
  }, [])

  const handelSignOut = async () => {
    const res = await signOutUser()
    if (res.success) {
      navigate('/login')
    } else {
      console.log("Erreur de déconnexion:", result.error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer ">
          <AvatarFallback className="bg-cyan-700 text-amber-100 font-semibold">
            {profil?.name && typeof profil?.name === 'string' && profil?.name.trim().charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2">
        <DropdownMenuLabel>
          <div className="font-bold" style={{ textTransform: 'uppercase' }}>{profil?.name}</div>
          <div className="text-xs text-muted-foreground">
            {profil?.role}<br />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer' onSelect={onProfileClick}>Profile</DropdownMenuItem>
        <DropdownMenuItem className='cursor-pointer'>Tutorials</DropdownMenuItem>
        <DropdownMenuItem className='cursor-pointer'>Documentation</DropdownMenuItem>
        <DropdownMenuItem className='cursor-pointer'>Talk to Us</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={handelSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
