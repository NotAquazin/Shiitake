import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewCard from './ReviewCard';

const API_BASE = '';
const Profile = () => {
    const { pk } = useParams(); 
    
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [monthReviews, setMonthReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false)
    const [desc, setDesc] = useState("")

    const [reported, setReported] = useState(new Set());
    const now = new Date();
    const currentMonth = now.getMonth(); 
    const currentYear = now.getFullYear();
    const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];

    const [crs, setCRs] = useState([]);
    const [favCRs, setFavCRs] = useState([]);
    const navigate = useNavigate();
    const currentUsername = localStorage.getItem('shiitake_username') || '';
    const currentUserID = localStorage.getItem('shiitake_userID')

    const [userVotes,     setUserVotes]     = useState(() => {

    if (!currentUsername || !localStorage.getItem('shiitake_token')) return {};
    try {
      return JSON.parse(localStorage.getItem(`shiitake_votes_${currentUsername}`) || '{}');
    } catch {
      return {};
    }

  })

    const isLoggedIn = !!localStorage.getItem('shiitake_token');

    const BadgeCircle = ({ badgeString }) => {
        // Splits string into badge rank and date
        const [rank, month, year] = badgeString.split('_');
        // Define colors and gradients for each tier
        const tierStyles = {
            Bronze: { 
                grad: 'linear-gradient(135deg, #a77044 0%, #CD7F32 100%)', 
                text: '#fff' 
            },
            Silver: { 
                grad: 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)', 
                text: '#fff' 
            },
            Gold: { 
                grad: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)', 
                text: '#fff' 
            },
            Platinum: { 
                grad: 'linear-gradient(135deg, #e5e4e2 0%, #b4b4b4 100%)', 
                text: '#333' 
            }
        };

        const currentStyle = tierStyles[rank] || { grad: '#ccc', text: '#fff' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: currentStyle.grad,
                color: currentStyle.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                marginBottom: '4px'
            }}>
                {rank.charAt(0)} {/* B, S, G, or P */}
            </div>
            <span style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>{month} {year}</span>
        </div>
    );
};

    function getReviewId(review) {
        return review?.id
    }

    function mapReviewFromApi(review) {
        return {
            ...review,
            id: getReviewId(review),
            author: review.author || 'Anonymous',
            text: review.text ?? review.comment ?? '',
            timestamp: review.timestamp ?? (review.createdAt ? review.createdAt.split('T')[0] : ''),
            likes: review.likes ?? 0,
            dislikes: review.dislikes ?? 0,
            amenities: Array.isArray(review.reviewTags) ? review.reviewTags : [],
        }
    }

    useEffect(() => {
        async function loadProfile() {
            try {

                // Use pk in the fetch URL
                const [userRes, revRes, crRes] = await Promise.all([
                    fetch(`${API_BASE}/users/${pk}`),
                    fetch(`${API_BASE}/reviews?UserId=${pk}`), // Filtered fetch
                    fetch(`${API_BASE}/CRs`)
                ]);
                const userData = await userRes.json();
                setUser(userData);

                const revData = await revRes.json();

                const revArray = Array.isArray(revData) ? revData : [];
                const myReviews = revArray
                .filter((r) => String(r.UserId) === String(pk)) 
                .map(mapReviewFromApi);
                const myMonthReviews = myReviews.filter((r) => {
                    const reviewDate = new Date(r.createdAt); 
                    return (
                        reviewDate.getMonth() === currentMonth &&
                        reviewDate.getFullYear() === currentYear
                    );
                });

                setReviews(myReviews);
                setMonthReviews(myMonthReviews);
                
                handleUpdateBadges(myMonthReviews);
                
                const crData = await crRes.json();
                setCRs(crData);
                
                if (user) {
                    setFavCRs(crs.filter(cr => user.favoriteCRs.includes(cr.id)));
                }

                setLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                setLoading(false);
            }
        }
        loadProfile();
    }, [pk, user]); 

    // HANDLERS 
    const handleEditProfile = () => {
        if (pk == currentUserID) {
            setEditingProfile(true);
            setDesc(user.description || "");
        }
    };

    const handleReport = (reviewId) => {
        setReported(new Set([...reported, reviewId]));
        alert('Review reported and hidden from your view.');
    };

    const handleDelete = async (reviewId) => {
        if (window.confirm('Delete your review?')) {
        try {
          const token = localStorage.getItem('shiitake_token')
          const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })

          if (!response.ok) throw new Error('Failed to delete review')

          setReviews((prev) => prev.filter((r) => getReviewId(r) !== reviewId))
        } catch (error) {
          console.error(error)
          alert('Could not delete review. Please try again.')
        }
      }
    };

    async function applyVote(reviewId, nextVote) {
      if (!isLoggedIn) {
        alert('Please log in to like or dislike reviews.')
        return
      }
      const prevVote = userVotes[reviewId]
      if (prevVote === nextVote) return

      try {
        const response = await fetch(`${API_BASE}/reviews/${reviewId}/vote`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ previousVote: prevVote, nextVote }),
        })

        if (!response.ok) throw new Error('Failed to update vote')

        const data = await response.json()
        const nextLikes = data.review?.likes ?? 0
        const nextDislikes = data.review?.dislikes ?? 0

        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            getReviewId(review) === reviewId
              ? { ...review, likes: nextLikes, dislikes: nextDislikes }
              : review
          )
        )

        setUserVotes((prev) => {
          const updated = { ...prev }

          if (nextVote) {
            updated[reviewId] = nextVote
          }

          if (!nextVote) {
            delete updated[reviewId]
          }

          if (currentUsername) {
            localStorage.setItem(`shiitake_votes_${currentUsername}`, JSON.stringify(updated))
          }

          return updated
        })
      } catch (error) {
        console.error(error)
        alert('Could not update vote. Please try again.')
      }
    }

    function handleLike(reviewId) {
      const currentVote = userVotes[reviewId]
      applyVote(reviewId, currentVote === 'like' ? null : 'like')
    }

    function handleDislike(reviewId) {
      const currentVote = userVotes[reviewId]
      applyVote(reviewId, currentVote === 'dislike' ? null : 'dislike')
    }

    const handleReviewToCR = (review) => {
        navigate(`/cr/${review.CRId}`); // Navigate to CR review page
    };

    const handleCRPage = (crID) => {
        navigate(`/cr/${crID}`); // Navigate to CR review page
    };

    async function handleSaveProfile(newDesc) {
      try {
          const response = await fetch(`${API_BASE}/users/${pk}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: newDesc,
              //profile:
            }),
          });

        if (!response.ok) {
                  const errorMsg = response?.error || JSON.stringify(response) || 'Unknown error';

            const errorData = await response.json();
            errorMsg = errorData.error || JSON.stringify(errorData);

        }
        const data = await response.json();
        const updatedUser = data.user;
        setUser(updatedUser);
        setEditingProfile(false)
      } catch (error) {
        console.error(error)
       
        alert('Could not save profile. Please try again.')
      }
    }

    async function handleUpdateBadges(reviews) {
        const newBadges = [];
        if (reviews.length >= 5) { newBadges.push(`Bronze_${monthNames[currentMonth]}_${currentYear}`) ;}
        if (reviews.length >= 10) { newBadges.push(`Silver_${monthNames[currentMonth]}_${currentYear}`) ;}
        if (reviews.length >= 20) { newBadges.push(`Gold_${monthNames[currentMonth]}_${currentYear}`) ;}
        if (reviews.length >= 30) { newBadges.push(`Platinum_${monthNames[currentMonth]}_${currentYear}`) ;}

        try {
            const response = await fetch(`${API_BASE}/users/${pk}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            badges: newBadges
            }),
          });

        if (!response.ok) {
            const errorMsg = response?.error || JSON.stringify(response) || 'Unknown error';

            const errorData = await response.json();
            errorMsg = errorData.error || JSON.stringify(errorData);

        }
        const data = await response.json();
        const updatedUser = data.user;
        setUser(updatedUser);
        setEditingProfile(false)
      } catch (error) {
        console.error(error)
       
        alert('Could not save profile. Please try again.')
      }
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Fetching Profile...</div>;
    if (!user) return <div style={{ textAlign: 'center', padding: '50px' }}>User not found in Supabase.</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '24px 16px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto'}}>

                {/* USER INFO SECTION */}
                <div style={{
                    background: '#153448',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '20px',
                    color: 'white',
                    textAlign: 'center' 
                }}>
                    <span style={{
                        width: '180px', height: '180px', borderRadius: '50%',
                        backgroundColor: '#000000', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontSize: '40px',
                        fontWeight: '700', margin: '20px auto'
                    }}>
                        {user.username ? user.username[0].toUpperCase() : "?"}
                    </span>

                    <span style={{
                        display: 'inline-block', padding: '0px 30px', borderRadius: '20px',
                        fontSize: '30px', fontWeight: '600', background: '#ffffff',
                        marginBottom: '12px', color: 'black',
                    }}>
                        {user.username}
                    </span>

                    <h1 style={{ margin: '0 0 4px', fontSize: '15px' }}>
                        {user.email}
                    </h1>
                    <p style={{ fontSize: '14px', opacity: 0.8 }}>Role: {user.role}</p>

                    {editingProfile ? (
                        <>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder={`${user.description || ""}`}
                            rows={4}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #948979', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                        />

                        <button onClick={() => handleSaveProfile(desc)} style={pillBtn('#c8e6c9', '#2e7d32')}>
                            Save
                        </button>
                        <button onClick={() => setEditingProfile(false)} style={pillBtn('#ffcdd2', '#c62828')}>
                            Cancel
                        </button>
                        </>
                    ) : (
                        <>
                        <p style={{ fontSize: '14px', opacity: 0.8 }}>{user.description}</p>
                        {pk == currentUserID ? 
                        <button onClick={() => handleEditProfile(pk)} style={pillBtn('#e3f2fd', '#1565c0')}>
                            Edit Profile 
                        </button>
                        : <></>}
                        </>
                    )}
                </div>

                {/* STATS / BADGES SECTION */}
                <div style={{
                    background: '#EDE5D5',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '20px',
                    textAlign: 'center' 
                }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#153448' }}>
                        User Statistics
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reviews.length}</div>
                            <div style={{ fontSize: '12px' }}>All-Time Reviews</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{monthReviews.length}</div>
                            <div style={{ fontSize: '12px' }}>Reviews This Month</div>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: '#EDE5D5',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '20px',
                }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#153448', textAlign: 'center' }}>
                        Badges
                    </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                            {user.badges.length > 0 ? (
                            user.badges.map((badgeStr, index) => (
                                <BadgeCircle key={index} badgeString={badgeStr} />
                            ))
                        ) : (
                            <p style={{ fontSize: '14px', color: '#999' }}>No badges yet!</p>
                        )}
                    </div>
                </div>

                <div style={{
                    background: '#EDE5D5',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '20px',
                }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#153448', textAlign: 'center' }}>
                        Favorite CRs
                    </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                            {favCRs.length > 0 ? (
                            favCRs.map(cr => (
                                 <button 
                                        onClick={() => handleCRPage(cr.id)} 
                                        style={pillBtn('#e3f2fd', '#1565c0')}>
                                    {cr.building} — {cr.name}
                                </button>
                            ))
                        ) : (
                            <p style={{ fontSize: '14px', color: '#999' }}>No favorites yet!</p>
                        )}
                    </div>
                </div>

                {/* USER'S ACTIVITY SECTION */}
                <div style={{
                    background: '#EDE5D5',
                    borderRadius: '12px',
                    padding: '20px 24px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', color: '#153448' }}>
                            My Review History
                        </h2>
                    </div>

                    {reviews.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
                            You haven't written any reviews yet.
                        </p>
                    ) : (
                        <>
                        {reviews
                            .filter((r) => !reported.has(r.id))
                            
                            .map((review) => (
                                <div key={review.id} className="review-wrapper" style={{ marginBottom: '20px' }}>
                                    <button 
                                        onClick={() => handleReviewToCR(review)} 
                                        style={pillBtn('#e3f2fd', '#1565c0')}
                                    >
                                    {(() => {
                                        const foundCR = crs.find(c => String(c.id) === String(review.CRId));
                                        return foundCR 
                                        ? `${foundCR.building} — ${foundCR.name}` 
                                        : 'Unknown CR';
                                    })()}
                                    </button>
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        currentUser={currentUsername}
                                        currentVote={userVotes[getReviewId(review)] || null}
                                        isLoggedIn={isLoggedIn}
                                        onEdit={() => handleReviewToCR(review)}
                                        onDelete={handleDelete}
                                        onReport={handleReport}
                                        onLike={handleLike}
                                        onDislike={handleDislike}
                                    />
                            </div>
                            ))
                    }</>)}
                </div>
            </div>
        </div>
    );
};

function pillBtn(background, color) {
  return {
    padding: '3px 10px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '20px',
    background,
    color,
    cursor: 'pointer',
  }
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#666',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default Profile;

