import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore, isFirebaseConfigured } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

/**
 * Model de Autenticação e Controle de Acesso (RBAC).
 * Isola toda a comunicação com o Firebase Auth e a coleção /users do Firestore.
 */
export class AuthModel {
  private currentUser: UserProfile | null = null;
  private authListeners: Array<(user: UserProfile | null) => void> = [];

  constructor() {
    this.initAuth();
  }

  private initAuth(): void {
    if (isFirebaseConfigured() && auth && firestore) {
      onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile = await this.fetchUserProfile(firebaseUser);
          this.currentUser = profile;
        } else {
          this.currentUser = null;
        }
        this.notifyListeners();
      });
    } else {
      // Modo Demonstração Local: inicia com perfil Administrador demonstrativo
      const savedMockUser = typeof localStorage !== 'undefined' ? localStorage.getItem('medtrack_demo_user') : null;
      if (savedMockUser) {
        try {
          this.currentUser = JSON.parse(savedMockUser);
        } catch {
          this.setDefaultDemoUser();
        }
      } else {
        this.setDefaultDemoUser();
      }
      setTimeout(() => this.notifyListeners(), 50);
    }
  }

  private setDefaultDemoUser(): void {
    this.currentUser = {
      uid: 'demo-admin-uid',
      email: 'admin.hospital@medtrack.org',
      displayName: 'Dr. Roberto (Engenheiro Clínico)',
      role: 'admin',
      createdAt: Date.now()
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('medtrack_demo_user', JSON.stringify(this.currentUser));
    }
  }

  /**
   * Obtém os dados e o papel (role) do usuário no Firestore
   */
  private async fetchUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
    if (!firestore) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Usuário',
        role: 'viewer',
        createdAt: Date.now()
      };
    }

    try {
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: data.displayName || firebaseUser.displayName || 'Usuário',
          role: (data.role as UserRole) || 'viewer',
          createdAt: data.createdAt || Date.now()
        };
      } else {
        // Papel padrão para novos cadastros: Administrador se for email de admin cadastrado, senão Comum
        const role: UserRole = (firebaseUser.email?.toLowerCase().includes('admin')) ? 'admin' : 'viewer';
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (role === 'admin' ? 'Administrador' : 'Técnico Hospitalar'),
          role,
          createdAt: Date.now()
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('[AuthModel] Erro ao buscar perfil no Firestore:', error);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.email?.split('@')[0] || 'Usuário',
        role: 'viewer',
        createdAt: Date.now()
      };
    }
  }

  public async login(email: string, pass: string): Promise<UserProfile> {
    if (isFirebaseConfigured() && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await this.fetchUserProfile(cred.user);
      this.currentUser = profile;
      this.notifyListeners();
      return profile;
    } else {
      // Login em modo de demonstração local
      const role: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'viewer';
      const mockProfile: UserProfile = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: role === 'admin' ? 'Administrador Hospitalar' : 'Usuário Comum (Visualizador)',
        role,
        createdAt: Date.now()
      };
      this.currentUser = mockProfile;
      localStorage.setItem('medtrack_demo_user', JSON.stringify(mockProfile));
      this.notifyListeners();
      return mockProfile;
    }
  }

  public async register(email: string, pass: string, role: UserRole = 'viewer'): Promise<UserProfile> {
    if (isFirebaseConfigured() && auth && firestore) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const userRef = doc(firestore, 'users', cred.user.uid);
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: role === 'admin' ? 'Administrador' : 'Usuário Comum',
        role,
        createdAt: Date.now()
      };
      await setDoc(userRef, newProfile);
      this.currentUser = newProfile;
      this.notifyListeners();
      return newProfile;
    } else {
      const mockProfile: UserProfile = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: role === 'admin' ? 'Administrador Hospitalar' : 'Usuário Comum (Visualizador)',
        role,
        createdAt: Date.now()
      };
      this.currentUser = mockProfile;
      localStorage.setItem('medtrack_demo_user', JSON.stringify(mockProfile));
      this.notifyListeners();
      return mockProfile;
    }
  }

  public async logout(): Promise<void> {
    if (isFirebaseConfigured() && auth) {
      await signOut(auth);
    }
    this.currentUser = null;
    localStorage.removeItem('medtrack_demo_user');
    this.notifyListeners();
  }

  /**
   * Permite alternar papel em modo demonstração para testar facilmente
   * a restrição de permissão de Administrador vs Usuário Comum
   */
  public switchDemoRole(role: UserRole): void {
    if (this.currentUser) {
      this.currentUser.role = role;
      this.currentUser.displayName = role === 'admin' ? 'Administrador Clínico' : 'Técnico de Enfermagem (Comum)';
      localStorage.setItem('medtrack_demo_user', JSON.stringify(this.currentUser));
      this.notifyListeners();
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  public subscribe(listener: (user: UserProfile | null) => void): () => void {
    this.authListeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.authListeners) {
      listener(this.currentUser);
    }
  }
}
