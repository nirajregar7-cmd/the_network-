const COLLEGE_IMAGE_MAP: Record<string, string> = {
  'IIT Madras':           'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
  'IIT Delhi':            'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&q=80',
  'IIT Bombay':           'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
  'IIT Kanpur':           'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
  'IIT Kharagpur':        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'IIT Roorkee':          'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&q=80',
  'IIT Guwahati':         'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80',
  'IIT Hyderabad':        'https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=800&q=80',
  'IIT (BHU) Varanasi':   'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
  'IIT Indore':           'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
  'IIT (ISM) Dhanbad':    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  'IIT Gandhinagar':      'https://images.unsplash.com/photo-1567448400815-cf3c5a3064d7?w=800&q=80',
  'IIT Patna':            'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
  'IIT Jodhpur':          'https://images.unsplash.com/photo-1527576539890-dfa815648363?w=800&q=80',
  'NIT Tiruchirappalli':  'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
  'NIT Surathkal':        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80',
  'NIT Warangal':         'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
  'NIT Rourkela':         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'NIT Calicut':          'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&q=80',
  'BITS Pilani':          'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
  'VIT Vellore':          'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
  'SRM Institute':        'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=800&q=80',
  'Manipal Institute of Technology': 'https://images.unsplash.com/photo-1497366858526-0766b58c6ef2?w=800&q=80',
  'AIIMS New Delhi':      'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80',
  'IIM Ahmedabad':        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
  'IIM Bangalore':        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'IIM Calcutta':         'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
  'Delhi University':     'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&q=80',
  'Jawaharlal Nehru University': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  'Ashoka University':    'https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=800&q=80',
  'IIIT Hyderabad':       'https://images.unsplash.com/photo-1567448400815-cf3c5a3064d7?w=800&q=80',
  'IIIT Delhi':           'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&q=80',
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&q=80',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=800&q=80',
];

export function getCollegeImage(name: string): string {
  if (COLLEGE_IMAGE_MAP[name]) return COLLEGE_IMAGE_MAP[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length];
}
