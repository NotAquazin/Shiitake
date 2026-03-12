import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReviewCard from './ReviewCard';

const Profile = () => {
    // Matches the name used in App.js (pk)
    const { pk } = useParams(); 
    
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reported, setReported] = useState(new Set());

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
                const myReviews = allReviews.filter(r => r.userId === parseInt(pk));
                setReviews(myReviews);

                setLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                setLoading(false);
            }
        }
        loadProfile();
    }, [pk]); // Re-run if the primary key changes

    // 2. HANDLERS (Required to fix the 'not defined' errors)
    const handleEdit = (review) => {
        console.log("Edit requested for review:", review.id);
        // Logic for opening a modal or form would go here
    };

    const handleReport = (reviewId) => {
        setReported(new Set([...reported, reviewId]));
        alert('Review reported and hidden from your view.');
    };

    const handleDelete = async (reviewId) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            // Ideally you'd call a DELETE fetch here
            setReviews(reviews.filter(r => r.id !== reviewId));
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Fetching Profile...</div>;
    if (!user) return <div style={{ textAlign: 'center', padding: '50px' }}>User not found in Supabase.</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                {/* --- USER IDENTITY SECTION --- */}
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
                </div>

                {/* --- STATS / BADGES SECTION --- */}
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
                            <div style={{ fontSize: '12px' }}>Reviews</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
                            <div style={{ fontSize: '12px' }}>Likes</div>
                        </div>
                    </div>
                </div>

                {/* --- USER'S ACTIVITY SECTION --- */}
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

export default Profile;