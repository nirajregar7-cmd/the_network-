export interface UserProfile {
  id: string;
  fullName: string;
  college: string;
  branch: string;
  year: number; // 1 to 4 or 5
  email: string;
  avatar: string;
  aboutMe: string;
  interests: string[];
  skills: string[];
  lookingFor: string[];
  isVerified: boolean;
  isSuspended: boolean;
  role: 'student' | 'admin';
  privacySettings: {
    showEmail: boolean;
    onlyAllowVerifiedConnections: boolean;
    hideProfileFromSearch: boolean;
  };
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  likes: string[]; // List of user IDs who liked
  comments: Comment[];
  communityId?: string; // Optional indicator of community post
  createdAt: string;
  academicTag?: string; // e.g. "Placement Prep", "Research Partner"
  projectTitle?: string; // e.g. "EcoDrone Seed Pitch"
  postImage?: string; // optional startup attachment image URL
  feeling?: string; // optional feeling status representing "how they are feeling / doing"

}

export interface Story {
  id: string;
  authorId: string;
  image?: string;
  content: string;
  createdAt: string;
  viewedBy: string[];
  reactions?: { [emoji: string]: number };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'Startup Discussion' | 'Friendship' | 'Study Partner' | 'Hackathon Team';
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon identifier
  memberIds: string[];
  tags: string[];
  category: string; // Engineering, Startups, Medical, Management, etc.
  threads?: DiscussionThread[];
  resources?: ResourceItem[];
}

export interface DiscussionThread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  replies: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  link: string;
  description: string;
  authorId: string;
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'suspended' | 'dismissed';
}
