export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  year: number;
  voting_start?: string;
  voting_end?: string;
  created_at: string;
}

export interface Nominee {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  image_url?: string;
  imageUrl?: string;
  is_active: boolean;
  created_at: string;
  vote_count?: number;
  linked_media?: MediaUpload | string;
}

export interface CreateNominee {
  name: string;
  description?: string;
  category: string;
  image_url?: string;
  approved_media_id?: string; 
}

export interface Vote {
  id: string;
  user_id: string;
  nominee_id: string;
  created_at: string;
}

export interface MediaUpload {
  id: string;
  user_id: User | string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_url?: string;
  media_type: 'photo' | 'video';
  file_size: number;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  admin_notes?: string;
  reviewed_by?: User | string;
  created_at: string;
  reviewed_at?: string;
}

export interface CategoryWithNominees extends Category {
  nominees: Nominee[];
}

export interface VotingResults {
  category: Category;
  nominees: Nominee[];
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  full_name: string;
  password: string;
}