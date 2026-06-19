import { UserProfile, Post, Community, Connection, DirectMessage, UserReport, Story } from '../types';

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    authorId: 'user-2', // Chloe
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80',
    content: 'PCB board V2.5 is printed! Robotic edge vision tests start this Tuesday. 🤖🚀',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    viewedBy: []
  },
  {
    id: 'story-2',
    authorId: 'user-1', // Aravind
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80',
    content: 'Our low-parameter MoE model achieved 86% less RAM overhead! PyTorch rules. 🧠🖥️',
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    viewedBy: []
  },
  {
    id: 'story-3',
    authorId: 'user-5', // Kenji
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&q=80',
    content: 'Reviewing SaaS pitch decks tonight. Let me know if you want co-founder guidance! 📊💻',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    viewedBy: []
  },
  {
    id: 'story-4',
    authorId: 'user-4', // Jasmine
    image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&q=80',
    content: 'Cognitive alignment draft accepted for peer indexing! Excited to share the theory doc. 📚✨',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    viewedBy: []
  },
  {
    id: 'story-5',
    authorId: 'user-6', // Ananya
    image: 'https://images.unsplash.com/photo-1541462608141-2758574e4058?w=500&q=80',
    content: 'Figma Auto-layout masterclass today. Redesigning our academic campus wallet dashboard! 🎨💎',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    viewedBy: []
  }
];

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'comm-1',
    name: 'Startups & Ventures',
    description: 'Find co-founders, brainstorm disruptive college models, talk lean startup, and discuss pitches.',
    icon: 'Rocket',
    memberIds: ['user-2', 'user-3', 'user-5', 'user-6'],
    tags: ['Pitching', 'SaaS', 'VC', 'Bootstrap'],
    category: 'Startups & Entrepreneurship'
  },
  {
    id: 'comm-2',
    name: 'AI/ML Research',
    description: 'Deep dive into LLMs, computer vision, vector search, research paper reviews, and GPU computing.',
    icon: 'Cpu',
    memberIds: ['user-1', 'user-2', 'user-4'],
    tags: ['PyTorch', 'Transformers', 'NLP', 'Research'],
    category: 'Engineering & Technology'
  },
  {
    id: 'comm-3',
    name: 'Competitive Coding',
    description: 'LeetCode grinds, Codeforces contests, advanced data structures, and algorithmic optimization tips.',
    icon: 'Code',
    memberIds: ['user-1', 'user-3'],
    tags: ['Algorithms', 'LeetCode', 'C++', 'Python'],
    category: 'Engineering & Technology'
  },
  {
    id: 'comm-4',
    name: 'Placement & Internship Prep',
    description: 'Support network for mock interviews, resume reviews, HR round scripts, and technical prep.',
    icon: 'Briefcase',
    memberIds: ['user-2', 'user-3', 'user-4', 'user-5'],
    tags: ['FAANG', 'Consulting', 'Interviews', 'Resumes'],
    category: 'Opportunities'
  },
  {
    id: 'comm-5',
    name: 'Product Design & UI/UX',
    description: 'Critique portfolios, share Figma masterclasses, discuss design systems, and collaborate on user research.',
    icon: 'Palette',
    memberIds: ['user-5', 'user-6'],
    tags: ['Figma', 'UI/UX', 'Product', 'Typography'],
    category: 'Design & Creativity'
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'admin-1',
    fullName: 'Prof. Sarah Lin (System Admin)',
    college: 'Stanford Academic Core',
    branch: 'Faculty Council',
    year: 4,
    email: 'sarah.lin@stanford.edu',
    avatar: 'SL',
    aboutMe: 'Preserving academic standards, connecting cross-campus labs, and moderating The Network to maintain healthy collaboration environments.',
    interests: ['Research', 'Higher Studies', 'Startups'],
    skills: ['Grant Writing', 'Machine Learning', 'Public Speaking'],
    lookingFor: ['Mentor', 'Research Collaborator'],
    isVerified: true,
    isSuspended: false,
    role: 'admin',
    privacySettings: {
      showEmail: true,
      onlyAllowVerifiedConnections: false,
      hideProfileFromSearch: false
    },
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'user-1',
    fullName: 'Aravind Nair',
    college: 'IIT Delhi',
    branch: 'Computer Science',
    year: 3,
    email: 'aravind.nair@cse.iitd.ac.in',
    avatar: 'AN',
    aboutMe: 'Working on resource-efficient LLMs. Preparing for placement rounds and looking to build a team for the upcoming National Web3 Hackathon. Passionate about procedural graphics and neural rendering!',
    interests: ['AI/ML', 'Coding', 'Research'],
    skills: ['React', 'Python', 'PyTorch', 'C++'],
    lookingFor: ['Hackathon Team', 'Research Collaborator', 'Study Partner'],
    isVerified: true,
    isSuspended: false,
    role: 'student',
    privacySettings: {
      showEmail: true,
      onlyAllowVerifiedConnections: false,
      hideProfileFromSearch: false
    },
    createdAt: '2026-02-15T10:30:00.000Z'
  },
  {
    id: 'user-2',
    fullName: 'Chloe Dupont',
    college: 'MIT',
    branch: 'Electrical Engineering',
    year: 4,
    email: 'cdupont@mit.edu',
    avatar: 'CD',
    aboutMe: 'Build-oriented hardware geek. Exploring the intersection of edge robotics and computer vision. Looking for a startup co-founder with soft-tier commercial skills to map business plans.',
    interests: ['Startups', 'AI/ML', 'Entrepreneurship'],
    skills: ['Python', 'Embedded Systems', 'PCB Design', 'MATLAB'],
    lookingFor: ['Startup Co-Founder', 'Career Guidance'],
    isVerified: true,
    isSuspended: false,
    role: 'student',
    privacySettings: {
      showEmail: false,
      onlyAllowVerifiedConnections: true,
      hideProfileFromSearch: false
    },
    createdAt: '2026-03-01T09:15:00.000Z'
  },
  {
    id: 'user-3',
    fullName: 'Rohan Mehta',
    college: 'BITS Pilani',
    branch: 'Electronics & Instrumentation',
    year: 2,
    email: 'rohan.mehta@pilani.bits-pilani.ac.in',
    avatar: 'RM',
    aboutMe: 'DSA grinder, looking for study partners to tackle hardcore programming questions together. Love competitive coding. Target is clearing GSoC and securing FAANG internships.',
    interests: ['Coding', 'Placement Preparation', 'Finance'],
    skills: ['C++', 'Data Structures', 'SQL', 'Algorithms'],
    lookingFor: ['Study Partner', 'Friends'],
    isVerified: true,
    isSuspended: false,
    role: 'student',
    privacySettings: {
      showEmail: true,
      onlyAllowVerifiedConnections: false,
      hideProfileFromSearch: false
    },
    createdAt: '2026-03-20T14:40:00.000Z'
  },
  {
    id: 'user-4',
    fullName: 'Jasmine Thorne',
    college: 'UC Berkeley',
    branch: 'Cognitive Science',
    year: 3,
    email: 'jthorne@berkeley.edu',
    avatar: 'JT',
    aboutMe: 'Investigating human-AI alignment metrics. Active in the college AI safety club. Let’s collaborate on interdisciplinary papers!',
    interests: ['Research', 'AI/ML', 'Higher Studies'],
    skills: ['Python', 'R', 'User Research', 'Writing'],
    lookingFor: ['Research Collaborator', 'Mentor'],
    isVerified: true,
    isSuspended: false,
    role: 'student',
    privacySettings: {
      showEmail: false,
      onlyAllowVerifiedConnections: false,
      hideProfileFromSearch: false
    },
    createdAt: '2026-04-05T11:10:00.000Z'
  },
  {
    id: 'user-5',
    fullName: 'Kenji Sato',
    college: 'Stanford University',
    branch: 'Management Science & Engineering',
    year: 2,
    email: 'ksato@stanford.edu',
    avatar: 'KS',
    aboutMe: 'Early stage enterprise software fanatic. Running a micro VC scout program. Looking to partner on high-growth SaaS hack projects and help with pitch reviews.',
    interests: ['Startups', 'Finance', 'Entrepreneurship'],
    skills: ['Financial Modeling', 'Marketing', 'Figma', 'UI/UX'],
    lookingFor: ['Project Partner', 'Startup Co-Founder', 'Friends'],
    isVerified: true,
    isSuspended: false,
    role: 'student',
    privacySettings: {
      showEmail: true,
      onlyAllowVerifiedConnections: true,
      hideProfileFromSearch: false
    },
    createdAt: '2026-04-12T16:20:00.000Z'
  },
  {
    id: 'user-6',
    fullName: 'Ananya Roy',
    college: 'Bits Pilani',
    branch: 'Computer Science',
    year: 1,
    email: 'ananya.roy@pilani.bits-pilani.ac.in',
    avatar: 'AR',
    aboutMe: 'Freshman curious about UI/UX and product design. Stumbling through CSS and Figma frameworks. Looking for a patient senior mentor!',
    interests: ['Design', 'Coding', 'Music'],
    skills: ['Figma', 'UI/UX', 'Video Editing', 'React'],
    lookingFor: ['Mentor', 'Friends', 'Study Partner'],
    isVerified: true,
    isSuspended: false,
    role: 'student',
    privacySettings: {
      showEmail: true,
      onlyAllowVerifiedConnections: false,
      hideProfileFromSearch: false
    },
    createdAt: '2026-05-02T13:05:00.000Z'
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    authorId: 'user-2',
    projectTitle: 'AeroCrops Vision',
    postImage: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80',
    content: 'We are building a smart agricultural drone prototype utilizing embedded computer vision to map field yield index offline. I have the hardware architecture locked, but need an ML-focused software partner to construct the object detection model (V8-Nano target). If you are into robotics, startups, and Python, let’s discuss co-founding!',
    likes: ['user-1', 'user-5'],
    academicTag: 'Startup Co-Founder',
    communityId: 'comm-1',
    feeling: '🚀 Motivated',
    createdAt: '2026-06-15T09:00:00.000Z',
    comments: [
      {
        id: 'comment-1',
        postId: 'post-1',
        authorId: 'user-1',
        content: 'This sounds extremely interesting, Chloe! I’ve done PyTorch model deployment on Jetson Nano. Sending you a connection request right away to chat more.',
        createdAt: '2026-06-15T09:30:00.000Z'
      }
    ]
  },
  {
    id: 'post-2',
    authorId: 'user-3',
    content: 'Is anyone up for organizing a highly targeted LeetCode grid study schedule? Aiming for 2-3 Medium/Hard trees & graphs problems per evening, shared over collaborative screen setups, and discussing spatial complexities. Placement season is coming up quickly and solo prep gets dry.',
    likes: ['user-1', 'user-6'],
    academicTag: 'Study Partner',
    communityId: 'comm-4',
    feeling: '🤯 Stressed',
    createdAt: '2026-06-16T15:20:00.000Z',
    comments: [
      {
        id: 'comment-2',
        postId: 'post-2',
        authorId: 'user-6',
        content: 'I would love to participate! I am still brushing up on Graph algorithms, but having a group format will help keep me motivated.',
        createdAt: '2026-06-16T16:00:00.000Z'
      }
    ]
  },
  {
    id: 'post-3',
    authorId: 'user-1',
    projectTitle: 'Neural MoE Parallel Processing',
    postImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    content: 'Unveiling a paper-draft on training low-parameter Mixture of Experts (MoE) on small consumer hardware profiles. Aiming for pre-print submittal by August. Looking for a peer collaborator with PyTorch pipeline parallelization experience to debug tensor partitioning constraints.',
    likes: ['user-4', 'user-2'],
    academicTag: 'Research Collaborator',
    communityId: 'comm-2',
    feeling: '🧠 Focused',
    createdAt: '2026-06-17T11:45:00.000Z',
    comments: []
  },
  {
    id: 'post-4',
    authorId: 'user-5',
    projectTitle: 'Capital Raise Deck V1.0',
    postImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
    content: 'Sharing our vetted Figma pitchdeck template optimized specifically for student startups requesting early academic grants. Includes visual slides on milestones, clear cap tables, and research proof of concepts. Let me know if you would like me to review your pitch!',
    likes: ['user-2', 'user-6', 'user-1', 'user-3'],
    academicTag: 'Startup Discussion',
    communityId: 'comm-1',
    feeling: '😊 Happy',
    createdAt: '2026-06-17T18:10:00.000Z',
    comments: []
  }
];

export const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: 'conn-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    type: 'Startup Discussion',
    message: 'Let’s partner up on the drone project! I have Jetson Nano expertise.',
    status: 'accepted',
    createdAt: '2026-06-15T10:00:00.000Z'
  },
  {
    id: 'conn-2',
    senderId: 'user-3',
    receiverId: 'user-1',
    type: 'Study Partner',
    message: 'Hey Aravind, I saw you grind DSA as well. Let’s practice complex graphs together.',
    status: 'accepted',
    createdAt: '2026-06-16T18:00:00.000Z'
  },
  {
    id: 'conn-3',
    senderId: 'user-6',
    receiverId: 'user-5',
    type: 'Friendship',
    message: 'Kenji, I am also at Stanford. Always down to discuss SaaS trends and tech design!',
    status: 'pending',
    createdAt: '2026-06-17T19:30:00.000Z'
  },
  {
    id: 'conn-4',
    senderId: 'user-4',
    receiverId: 'user-1',
    type: 'Research Partner' as any, // fallback
    message: 'Would love to discuss your low-parameter MoE paper draft. Looks like we have overlapping theories.',
    status: 'pending',
    createdAt: '2026-06-18T05:00:00.000Z'
  }
];

export const INITIAL_MESSAGES: DirectMessage[] = [
  {
    id: 'msg-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    content: 'Hey Chloe, awesome to connect regarding the smart agricultural drone software backend!',
    createdAt: '2026-06-15T10:05:00.000Z',
    isRead: true
  },
  {
    id: 'msg-2',
    senderId: 'user-2',
    receiverId: 'user-1',
    content: 'Thanks for reaching out Aravind! Yes, your experience with neural pipeline parallelization is extremely relevant. When are you free for a call?',
    createdAt: '2026-06-15T10:15:00.000Z',
    isRead: true
  },
  {
    id: 'msg-3',
    senderId: 'user-1',
    receiverId: 'user-2',
    content: 'We can chat Friday afternoon. I can show you a quick demo repository of my PyTorch setup!',
    createdAt: '2026-06-15T10:20:00.000Z',
    isRead: false
  },
  {
    id: 'msg-4',
    senderId: 'user-3',
    receiverId: 'user-1',
    content: 'Hey Aravind, are we doing LeetCode problems tonight?',
    createdAt: '2026-06-16T19:00:00.000Z',
    isRead: true
  },
  {
    id: 'msg-5',
    senderId: 'user-1',
    receiverId: 'user-3',
    content: 'Hey Rohan! Yes, absolutely. Let’s tackle some graph problems around 9 PM.',
    createdAt: '2026-06-16T19:10:00.000Z',
    isRead: true
  }
];

export const MOCK_REPORTS: UserReport[] = [
  {
    id: 'rep-1',
    reporterId: 'user-3',
    reportedUserId: 'user-5',
    reason: 'Spam',
    description: 'Sending duplicate commercial marketing self-promotion links to profile comments repeatedly.',
    createdAt: '2026-06-17T20:00:00.000Z',
    status: 'pending'
  }
];

// Helper to auto-respond to users to showcase real-time response inside our simulation
export function getSimulatedReply(partnerId: string, userMessage: string): string {
  const norm = userMessage.toLowerCase();
  
  if (partnerId === 'user-2') { // Chloe
    if (norm.includes('hello') || norm.includes('hey') || norm.includes('hi')) {
      return "Hi there! Glad to connect on The Network. Are you interested in the drone computer vision stack or general robotics research?";
    }
    if (norm.includes('drone') || norm.includes('vision') || norm.includes('pytorch') || norm.includes('opencv')) {
      return "That's fantastic. We require low-power execution models. Have you worked with quantization tools or TensorRT before?";
    }
    return "Awesome. This sounds very promising! Let's schedule a Zoom call this Saturday to go over our hardware setup.";
  }
  
  if (partnerId === 'user-3') { // Rohan
    if (norm.includes('study') || norm.includes('leetcode') || norm.includes('interview') || norm.includes('dsa')) {
      return "Awesome! Tonight let's work on Graph Traversal and Dijkstra optimization. Sound good to you?";
    }
    return "Great point compiling those! Let's push our solutions to a shared GitHub folder so we can peer-review the space complexities.";
  }
  
  if (partnerId === 'user-5') { // Kenji
    if (norm.includes('pitch') || norm.includes('startup') || norm.includes('idea')) {
      return "Nice! Academic startup grants are highly structured. I'd be happy to read your executive deck over Figma. Send me a workspace link!";
    }
    return "Exactly. College environments represent the best sandbox for testing scalable products before high capital commitments. Let's keep exploring!";
  }

  return "Thanks for your message! This is a great collaboration opportunity. Let's check in with each other tomorrow.";
}
