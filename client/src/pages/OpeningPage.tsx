/**
 * Compatibility route for direct /opening links.
 *
 * The app-level SplashScreen is the single source of truth for the opening
 * experience. Keeping this route empty prevents a second splash layer from
 * competing for z-index, timers, audio, and completion callbacks.
 */
export const OpeningPage: React.FC = () => null;

export default OpeningPage;
