// Primary navigation, shared by every page. The homepage ("front") links to its
// own sections; every other page links to routes.
export const NAV = [
  { label: 'About',           route: '/about/',           hash: '#doctrine' },
  { label: 'Pillars',         route: '/pillars/',         hash: '#pillars'  },
  { label: 'Before Congress', route: '/restitution-246/', hash: '#congress' },
  { label: 'The Record',      route: '/record/',          hash: '#record'   },
  { label: 'Coalition',       route: '/coalition/',       hash: '#network'  },
];

export const GIVE_HREF = 'https://e5enclave.com/donate/';

export const VARIANTS = {
  route: { homeHref: '/',    href: n => n.route, footMargin: 'clamp(60px,8vw,120px)', photoCredits: false },
  front: { homeHref: '#top', href: n => n.hash,  footMargin: 'clamp(80px,9vw,140px)', photoCredits: true  },
};
