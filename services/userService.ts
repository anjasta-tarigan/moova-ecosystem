// @deprecated Use services/api/profileApi.ts instead
import { profileApi } from "./api/profileApi";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender: string;
  address: string;
  avatar: string;
  schoolName: string;
  schoolLevel: string;
  major: string;
  studentId: string;
  grade: string;
  province: string;
  city: string;
  bio: string;
  skills: string[];
  linkedin: string;
  github: string;
  completeness: number;
}

const toUserProfile = (payload: any): UserProfile => {
  const { user, profile } = payload || {};
  return {
    id: user?.id ?? "",
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: profile?.phone ?? "",
    birthDate: profile?.birthDate
      ? new Date(profile.birthDate).toISOString().slice(0, 10)
      : "",
    gender: profile?.gender ?? "",
    address: profile?.address ?? "",
    avatar: profile?.avatar ?? "",
    schoolName: profile?.schoolName ?? "",
    schoolLevel: profile?.schoolLevel ?? "",
    major: profile?.major ?? "",
    studentId: profile?.studentId ?? "",
    grade: profile?.grade ?? "",
    province: profile?.province ?? "",
    city: profile?.city ?? "",
    bio: profile?.bio ?? "",
    skills: profile?.skills ?? [],
    linkedin: profile?.linkedin ?? "",
    github: profile?.github ?? "",
    completeness: profile?.completeness ?? 0,
  };
};

class UserService {
  async getProfile(): Promise<UserProfile> {
    const res = await profileApi.getProfile();
    return toUserProfile(res.data.data);
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const payload = {
      fullName: updates.fullName,
      phone: updates.phone,
      birthDate: updates.birthDate,
      gender: updates.gender,
      address: updates.address,
      avatar: updates.avatar,
      schoolName: updates.schoolName,
      schoolLevel: updates.schoolLevel,
      major: updates.major,
      studentId: updates.studentId,
      grade: updates.grade,
      province: updates.province,
      city: updates.city,
      bio: updates.bio,
      skills: updates.skills,
      linkedin: updates.linkedin,
      github: updates.github,
    };

    const res = await profileApi.updateProfile(payload);
    return toUserProfile(res.data.data);
  }

  async uploadAvatar(file: File): Promise<string> {
    const res = await profileApi.uploadAvatar(file);
    return res.data.data?.avatar || res.data.data || "";
  }
}

export const userService = new UserService();
