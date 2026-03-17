
// Types for User Profile
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  avatar: string;
  
  // Academic & Affiliation (REQUIRED)
  affiliationType: 'High School' | 'University' | 'Research Institution' | 'Company' | 'Independent';
  institution: string; // School / Org Name
  faculty: string;     // Department / Faculty
  fieldOfStudy: string; // Major
  educationLevel: 'High School' | 'Undergraduate' | 'Master' | 'PhD' | 'Professional' | 'Other';
  studentId: string;   // Optional but recommended
  graduationYear: string;

  // Public Profile
  bio: string;
  skills: string[];
  website: string;
  linkedin: string;
  github: string;
  googleScholar: string;

  // System
  completeness: number;
}

const DB_KEY_PROFILE = 'moova_user_profile_v2'; // Version bump
const SESSION_KEY = 'moova_user';

const DEFAULT_PROFILE: UserProfile = {
  id: 'u-default',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  avatar: '',
  
  affiliationType: 'University',
  institution: '',
  faculty: '',
  fieldOfStudy: '',
  educationLevel: 'Undergraduate',
  studentId: '',
  graduationYear: '',

  bio: '',
  skills: [],
  website: '',
  linkedin: '',
  github: '',
  googleScholar: '',
  
  completeness: 0
};

class UserService {
  // Calculate profile completeness based on mandatory academic fields
  private calculateCompleteness(profile: UserProfile): number {
    const requiredFields = [
      'firstName', 'lastName', 'country', 'phone',
      'affiliationType', 'institution', 'fieldOfStudy', 'educationLevel', 'graduationYear'
    ];
    
    let filledCount = 0;
    requiredFields.forEach(field => {
      if ((profile as any)[field] && (profile as any)[field].trim() !== '') {
        filledCount++;
      }
    });

    const coreScore = (filledCount / requiredFields.length) * 80; // Core info is 80% of the score
    
    // Bonus for optional fields (20%)
    let bonus = 0;
    if (profile.avatar) bonus += 5;
    if (profile.bio) bonus += 5;
    if (profile.skills.length > 0) bonus += 5;
    if (profile.linkedin || profile.googleScholar || profile.studentId) bonus += 5;

    return Math.min(100, Math.round(coreScore + bonus));
  }

  isProfileComplete(profile: UserProfile): boolean {
    return this.calculateCompleteness(profile) >= 80; // 80% means all core fields are filled
  }

  async getProfile(): Promise<UserProfile> {
    await new Promise(r => setTimeout(r, 600)); // Simulate network
    
    const sessionStr = localStorage.getItem(SESSION_KEY);
    const storedProfileStr = localStorage.getItem(DB_KEY_PROFILE);
    
    let profile: UserProfile;

    if (storedProfileStr) {
      profile = JSON.parse(storedProfileStr);
    } else if (sessionStr) {
      // Seed from basic session data if no rich profile exists
      const session = JSON.parse(sessionStr);
      profile = {
        ...DEFAULT_PROFILE,
        id: session.id,
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
        // Mock seed data for demo feel
        institution: session.organization || 'Imperial College London',
        country: 'United Kingdom',
        fieldOfStudy: 'Computer Science',
        affiliationType: 'University',
        skills: ['React', 'Data Science', 'Design Thinking'],
        bio: 'Passionate about leveraging technology for sustainable development goals.',
        avatar: session.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
      };
      profile.completeness = this.calculateCompleteness(profile);
      this.saveToStorage(profile);
    } else {
      throw new Error("No active session");
    }

    return profile;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise(r => setTimeout(r, 800)); // Simulate network
    
    const current = await this.getProfile();
    const updated = { ...current, ...updates };
    updated.completeness = this.calculateCompleteness(updated);
    
    this.saveToStorage(updated);
    
    // Update basic session storage too for header consistency
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...session,
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatar: updated.avatar
      }));
    }

    return updated;
  }

  async uploadAvatar(file: File): Promise<string> {
    await new Promise(r => setTimeout(r, 1500)); // Simulate upload
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  private saveToStorage(profile: UserProfile) {
    localStorage.setItem(DB_KEY_PROFILE, JSON.stringify(profile));
  }
}

export const userService = new UserService();
