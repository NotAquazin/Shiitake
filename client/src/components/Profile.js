import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReviewCard from './ReviewCard';

const API_BASE = 'http://localhost:13000';
const Profile = () => {
    // Matches the name used in App.js (pk)
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
    
    useEffect(() => {
        async function loadProfile() {
            try {
                

                // Use pk in the fetch URL
                const userRes = await fetch(`http://localhost:13000/users/${pk}`);
                const userData = await userRes.json();
                setUser(userData);

                const revRes = await fetch(`http://localhost:13000/reviews`);
                const allReviews = await revRes.json();
                
                // Filter reviews using the primary key
                const myReviews = allReviews.filter(r => r.UserId === parseInt(pk));
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

                setLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                setLoading(false);
            }
        }
        loadProfile();
    }, [pk]); 

    // HANDLERS 
    const handleEditProfile = () => {
        setEditingProfile(true);
        setDesc(user.description || "");
    };
    
    const handleEdit = (review) => {
        console.log("Edit requested for review:", review.id);
    };

    const handleReport = (reviewId) => {
        setReported(new Set([...reported, reviewId]));
        alert('Review reported and hidden from your view.');
    };

    const handleDelete = async (reviewId) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            setReviews(reviews.filter(r => r.id !== reviewId));
        }
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
        if (reviews.length >= 5) { newBadges.push(`Bronze_${currentMonth}${currentYear}`) ;}
        if (reviews.length >= 10) { newBadges.push(`Silver_${currentMonth}${currentYear}`) ;}
        if (reviews.length >= 20) { newBadges.push(`Gold_${currentMonth}${currentYear}`) ;}
        if (reviews.length >= 30) { newBadges.push(`Platinum_${currentMonth}${currentYear}`) ;}
              console.log(newBadges);

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
        <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                {/* USER INFO SECTION */}
                <div style={{
                    background: '#153448',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '20px',
                    color: 'white',
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
                        <button onClick={() => handleEditProfile(pk)} style={pillBtn('#e3f2fd', '#1565c0')}>
                            Edit Profile
                        </button>
                        </>
                    )}
                </div>

                {/* STATS / BADGES SECTION */}
                <div style={{
                    background: '#EDE5D5',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '20px',
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
                    <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#153448' }}>
                        Badges
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.badges}</div>
                        </div>
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
                        reviews
                            .filter((r) => !reported.has(r.id))
                            .map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    currentUser={user.username}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onReport={handleReport}
                                    onLike={() => {}}
                                    onDislike={() => {}}
                                />
                            ))
                    )}
                </div>
            </div>
        </div>
    );
};

function pillBtn(background, color) {
  return {
    padding: '3px 10px',
    fontSize: '11px',
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

