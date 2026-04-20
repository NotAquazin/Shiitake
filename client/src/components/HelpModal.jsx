import { useState, useEffect } from 'react';

import imgRegister    from '../assets/help/register.png';
import imgMapPopup    from '../assets/help/map_popup.png';
import imgMapNav      from '../assets/help/map_nav.png';
import imgCRPage      from '../assets/help/cr_page.png';
import imgReviewForm  from '../assets/help/review_form.png';
import imgProfile     from '../assets/help/profile.png';
import imgLeaderboard from '../assets/help/leaderboard.png';
import imgSearch      from '../assets/help/search.png';

// ─── Styles (defined before PAGES so JSX inside PAGES can reference them) ─────

const listStyle = {
  margin: 0, padding: 0, listStyle: 'none',
  display: 'flex', flexDirection: 'column', gap: '10px',
};

const stepCardStyle = {
  background: '#f5f0ea',
  borderRadius: '8px',
  padding: '12px 14px',
  marginBottom: '10px',
  borderLeft: '2px solid #153448',
};

const filterChipStyle = {
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '20px',
  background: '#f5f0ea',
  border: '1px solid #d0c8be',
  color: '#555',
};

const navBtnStyle = {
  fontSize: '13px',
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #d0c8be',
  background: 'transparent',
  color: '#153448',
  cursor: 'pointer',
  fontWeight: 500,
};

const codeStyle = {
  fontSize: '12px',
  background: '#e8e2d9',
  padding: '1px 5px',
  borderRadius: '4px',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Step({ label, children }) {
  return (
    <div style={stepCardStyle}>
      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '13px', color: '#153448' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '13px' }}>{children}</p>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <li style={{ display: 'flex', gap: '10px' }}>
      <span style={{ color: '#153448', fontWeight: 700, flexShrink: 0 }}>›</span>
      <span>{children}</span>
    </li>
  );
}

// ─── Page definitions ─────────────────────────────────────────────────────────

// layout: 'top'  → image(s) above text (landscape images)
// layout: 'side' → image on left, text on right (portrait images)

const PAGES = [
  {
    icon: '🔑',
    label: 'Getting started',
    title: 'Create your account',
    layout: 'side',
    images: [imgRegister],
    imageAlts: ['Register page'],
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>
          Welcome to <strong>Shiitake</strong> — your guide to campus comfort rooms at Ateneo.
        </p>
        <Step label="Step 1 — Register">
          Sign up using your Ateneo-provided email ending in{' '}
          <code style={codeStyle}>@student.ateneo.edu</code>. Other email addresses won't be accepted.
        </Step>
        <Step label="Step 2 — Log in">
          Once registered, log in with your credentials to get started.
        </Step>
      </>
    ),
  },
  {
    icon: '🗺️',
    label: 'Explore the map',
    title: 'Finding a CR near you',
    layout: 'top',
    images: [imgMapPopup, imgMapNav],
    imageAlts: ['Map with CR popup', 'Map with navigation'],
    content: (
      <ul style={listStyle}>
        <Bullet>
          Tap a <strong>CR marker</strong> to choose a building, then select a floor and specific CR.
          You'll see its average rating and total number of reviews.
        </Bullet>
        <Bullet>
          Tap <strong>Navigate</strong> to get directions from your current location.
        </Bullet>
        <Bullet>
          Tap <strong>See reviews</strong> to read user feedback or leave a review — this takes you
          to the CR page.
        </Bullet>
      </ul>
    ),
  },
  {
    icon: '⭐',
    label: 'CR page',
    title: 'Viewing & leaving reviews',
    layout: 'side',
    images: [imgCRPage, imgReviewForm],
    imageAlts: ['CR page with reviews', 'Review form'],
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>
          The CR page shows all reviews from other users. To add yours, tap{' '}
          <strong>Leave a review</strong>.
        </p>
        <ul style={listStyle}>
          <Bullet>
            Give a <strong>star rating</strong> and toggle which amenities are present. Pre-filled
            amenities are based on past reviews — you can adjust them.
          </Bullet>
          <Bullet>
            A written comment is <strong>optional</strong>, but encouraged!
          </Bullet>
          <Bullet>
            You can <strong>edit</strong> your review anytime, but you'll need to wait{' '}
            <strong>24 hours</strong> before submitting a new review for the same CR.
          </Bullet>
        </ul>
      </>
    ),
  },
  {
    icon: '👤',
    label: 'Your profile',
    title: 'Track your contributions',
    layout: 'side',
    images: [imgProfile],
    imageAlts: ['Profile page'],
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>
          Tap <strong>Profile</strong> in the navigation bar to see your activity.
        </p>
        <ul style={listStyle}>
          <Bullet>See your <strong>total reviews</strong> and how many you've left this month.</Bullet>
          <Bullet>Browse your <strong>review history</strong> for every CR you've visited.</Bullet>
          <Bullet>Earn <strong>exclusive monthly badges</strong> based on how many reviews you submit that month.</Bullet>
        </ul>
      </>
    ),
  },
  {
    icon: '🏆',
    label: 'Leaderboards',
    title: 'See the top-rated CRs',
    layout: 'side',
    images: [imgLeaderboard],
    imageAlts: ['Leaderboard page'],
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>
          Tap <strong>Leaderboards</strong> in the nav bar to rank CRs by different criteria.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {['Highest rated', 'Lowest rated', 'Most reviewed', 'Nearest'].map((f) => (
            <span key={f} style={filterChipStyle}>{f}</span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '13px' }}>
          Tap any CR in the leaderboard to go directly to its CR page.
        </p>
      </>
    ),
  },
  {
    icon: '🔍',
    label: 'Search',
    title: 'Find a specific CR',
    layout: 'top',
    images: [imgSearch],
    imageAlts: ['Search page'],
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>
          Tap <strong>Search</strong> in the nav bar to find CRs that match what you need.
        </p>
        <p style={{ margin: '0 0 10px', fontSize: '13px' }}>You can filter by:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {['Building', 'Distance', 'Floor', 'Amenities', 'Rating'].map((f) => (
            <span key={f} style={filterChipStyle}>{f}</span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
          You're all set! Enjoy using Shiitake 🍄
        </p>
      </>
    ),
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function HelpModal({ onClose }) {
  const [current, setCurrent] = useState(0);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 500);

  useEffect(() => {
    function onResize() { setIsNarrow(window.innerWidth < 500); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const page = PAGES[current];
  const isLast = current === PAGES.length - 1;
  const useSide = page.layout === 'side' && !isNarrow;

  function prev() { if (current > 0) setCurrent(current - 1); }
  function next() {
    if (isLast) onClose();
    else setCurrent(current + 1);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        padding: isNarrow ? '0' : '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: isNarrow ? '16px 16px 0 0' : '16px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          alignSelf: isNarrow ? 'flex-end' : 'center',
        }}
      >
        {/* Header */}
        <div style={{ padding: isNarrow ? '18px 20px 0' : '24px 28px 0', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#DFD0B8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', flexShrink: 0,
              }}>
                {page.icon}
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#888', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {page.label}
                </p>
                <h2 style={{ fontSize: '17px', fontWeight: 600, margin: 0, color: '#153448' }}>
                  {page.title}
                </h2>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                {current + 1} of {PAGES.length}
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '20px', color: '#888', lineHeight: 1, padding: '2px 4px',
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: isNarrow ? '0 20px' : '0 28px', flex: '1 1 auto', overflowY: 'auto' }}>
          {useSide ? (
            /* Side layout: image(s) left, text right */
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{
                flex: '0 0 44%',
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                {page.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={page.imageAlts[i] || ''}
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      border: '1px solid #e0d8cc',
                      objectFit: 'contain',
                      background: '#f5f0ea',
                    }}
                  />
                ))}
              </div>
              <div style={{ flex: '1 1 0', fontSize: '14px', color: '#444', lineHeight: 1.75, paddingBottom: '8px' }}>
                {page.content}
              </div>
            </div>
          ) : (
            /* Stacked layout: image(s) above text (also used on narrow screens) */
            <>
              <div style={{
                display: 'flex', gap: '8px', marginBottom: '16px',
                justifyContent: page.images.length === 1 ? 'center' : 'space-between',
              }}>
                {page.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={page.imageAlts[i] || ''}
                    style={{
                      width: page.images.length === 1 ? '100%' : '49%',
                      borderRadius: '10px',
                      border: '1px solid #e0d8cc',
                      objectFit: page.layout === 'side' ? 'contain' : 'cover',
                      objectPosition: 'center top',
                      maxHeight: isNarrow ? '160px' : '180px',
                      background: page.layout === 'side' ? '#f5f0ea' : 'none',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '14px', color: '#444', lineHeight: 1.75, paddingBottom: '8px' }}>
                {page.content}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: isNarrow ? '16px 20px 24px' : '20px 28px 24px', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={prev}
              disabled={current === 0}
              style={{
                ...navBtnStyle,
                opacity: current === 0 ? 0.3 : 1,
                cursor: current === 0 ? 'default' : 'pointer',
              }}
            >
              ← Back
            </button>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {PAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to step ${i + 1}`}
                  style={{
                    width: i === current ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '20px',
                    background: i === current ? '#153448' : '#d0c8be',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'width 0.2s, background 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              style={{ ...navBtnStyle, background: '#153448', color: '#fff', border: 'none' }}
            >
              {isLast ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
