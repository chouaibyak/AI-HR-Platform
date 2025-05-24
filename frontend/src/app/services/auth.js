import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";

export const registerWithEmailAndPassword = async (name, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  const idToken = await userCredential.user.getIdToken();
  localStorage.setItem('token', idToken); // Store the token
  return { user: userCredential.user, idToken };
};

export const loginWithEmailAndPassword = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  localStorage.setItem('token', idToken); // Store the token
  return { user: userCredential.user, idToken };
};

export const signOutUser = async () => {
  try {
    await signOut(auth);  // Appel à la méthode Firebase signOut pour déconnecter l'utilisateur
    localStorage.removeItem('token'); // Remove the token on sign out
    console.log("Utilisateur déconnecté avec succès et token supprimé");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la déconnexion", error);
    return { success: false, error: error.message };
  }
};
