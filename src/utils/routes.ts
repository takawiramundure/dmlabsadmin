// Available routes in the BWEIC website
export const availableRoutes = [
    { path: '/', label: 'Home' },
    { path: '/who-we-are', label: 'Who We Are' },
    { path: '/our-work', label: 'Our Work' },
    { path: '/our-work/healing-wellness', label: 'Healing & Wellness' },
    { path: '/our-work/empowerment', label: 'Empowerment & Capacity Building' },
    { path: '/our-work/community', label: 'Community & Belonging' },
    { path: '/our-work/sovereignty-circle', label: 'The Sovereignty Circle' },
    { path: '/take-action', label: 'Take Action' },
    { path: '/media-center', label: 'Media Center' },
    { path: '/videos', label: 'Videos' },
    { path: '/upcoming-events', label: 'Upcoming Events' },
    { path: '/partners', label: 'Partners' },
    { path: '/blogs', label: 'Blog' },
    { path: '/shop', label: 'Shop' },
    { path: '/our-story', label: 'Our Story' },
    { path: '/leadership', label: 'Leadership' },
    { path: '/board-members', label: 'Board Members' },
    { path: '/careers', label: 'Careers' },
];

export function searchRoutes(query: string) {
    if (!query) return availableRoutes;

    const lowerQuery = query.toLowerCase();
    return availableRoutes.filter(route =>
        route.path.toLowerCase().includes(lowerQuery) ||
        route.label.toLowerCase().includes(lowerQuery)
    );
}
