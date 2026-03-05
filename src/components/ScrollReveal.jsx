import { useEffect, useRef } from 'react';

/**
 * Lightweight scroll reveal wrapper.
 * Adds the `.revealed` class when the element scrolls into view.
 * Pure UI utility — no business logic.
 */
const ScrollReveal = ({ children, className = '', threshold = 0.15, delay = 0, style }) => {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => el.classList.add('revealed'), delay);
                    observer.unobserve(el);
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, delay]);

    return (
        <div ref={ref} className={`reveal ${className}`} style={style}>
            {children}
        </div>
    );
};

export default ScrollReveal;
