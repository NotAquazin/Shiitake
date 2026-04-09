import StarRating from './StarRating'

function ReviewCard({ review, currentUser, currentVote, isLoggedIn, onLike, onDislike, onEdit, onDelete, onReport }) {

  const reviewId = review?.pk ?? review?.id
  const likes = review?.likes ?? 0
  const dislikes = review?.dislikes ?? 0

  // check if this review belongs to the current user
  const isMyReview = review.author === currentUser

  return (
    <div style={{ background: 'white', border: '1px solid #DFD0B8', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>

      {/* author name, date, and stars */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#153448' }}>
            {review.author}
          </span>
          <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
            {review.timestamp}
          </span>
        </div>
        <StarRating rating={review.rating} interactive={false} />
      </div>

      {/* review text, only renders if there is text */}
      {review.text && (
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#444', lineHeight: '1.6' }}>
          {review.text}
        </p>
      )}

      {/* like, dislike, and action buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

        <button
          onClick={() => onLike(reviewId)}
          disabled={!isLoggedIn}
          title={!isLoggedIn ? 'Log in to vote' : undefined}
          style={{
            ...pillBtn(currentVote === 'like' ? '#c8e6c9' : '#e8f5e9', '#2e7d32'),
            opacity: isLoggedIn ? 1 : 0.5,
            cursor: isLoggedIn ? 'pointer' : 'not-allowed',
          }}
        >
          👍 {likes}
        </button>

        <button
          onClick={() => onDislike(reviewId)}
          disabled={!isLoggedIn}
          title={!isLoggedIn ? 'Log in to vote' : undefined}
          style={{
            ...pillBtn(currentVote === 'dislike' ? '#ffcdd2' : '#fce4ec', '#c62828'),
            opacity: isLoggedIn ? 1 : 0.5,
            cursor: isLoggedIn ? 'pointer' : 'not-allowed',
          }}
        >
          👎 {dislikes}
        </button>

        {/* pushes edit/delete/report to the right */}
        <div style={{ flex: 1 }} />

        {/* your own review, show edit and delete */}
        {isMyReview && (
          <>
            <button onClick={() => onEdit(review)} style={pillBtn('#e3f2fd', '#1565c0')}>
              Edit
            </button>
            <button onClick={() => onDelete(reviewId)} style={pillBtn('#fce4ec', '#c62828')}>
              Delete
            </button>
          </>
        )}

        {/* someone else's review, show report */}
        {!isMyReview && (
          <button onClick={() => onReport(reviewId)} style={pillBtn('#fff3e0', '#e65100')}>
            Report
          </button>
        )}

      </div>
    </div>
  )
}

// returns a style object for the small pill buttons
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

export default ReviewCard