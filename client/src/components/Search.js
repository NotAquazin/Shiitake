import { useState } from 'react';
import sampleCR from './crData';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import { useParams } from 'react-router-dom';

const CRPage = () => {
  const { id } = useParams(); // 'faura-1' in this example

// The logged-in user's name. Replace with real auth later.
  const CURRENT_USER = 'You'

  const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest Rated', 'Lowest Rated', 'Most Liked']

    const [reviews,       setReviews]       = useState(sampleCR.reviews)
    const [showForm,      setShowForm]      = useState(false)
    const [editingReview, setEditingReview] = useState(null)
    const [sortBy,        setSortBy]        = useState('Newest')
    const [reported,      setReported]      = useState(new Set())

    // Checks if already posted review
    const alreadyReviewed = reviews.some((r) => r.author === CURRENT_USER)

    // Average rating across all reviews
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Sort a copy of reviews (never mutate state directly)
    const sortedReviews = [...reviews].sort((a, b) => {
      if (sortBy === 'Newest')        return b.timestamp.localeCompare(a.timestamp)
      if (sortBy === 'Oldest')        return a.timestamp.localeCompare(b.timestamp)
      if (sortBy === 'Highest Rated') return b.rating - a.rating
      if (sortBy === 'Lowest Rated')  return a.rating - b.rating
      if (sortBy === 'Most Liked')    return b.likes   - a.likes
      return 0
    })

  const [inputs, setInputs] = useState({});

  const handleChange = (e) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    setInputs(values => ({...values, [name]: value}))
  }

  const handleSubmit = (event) => {
    let fillings = '';
    if (inputs.tomato) fillings += 'tomato';
    if (inputs.onion) {
      if (inputs.tomato) fillings += ' and ';
      fillings += 'onion';
    }
    if (fillings == '') fillings = 'no fillings';
    alert(`${inputs.firstname} wants a burger with ${fillings}`);
    event.preventDefault();
  };
    // Event handlers 

    function handleSearch() {
    }

    // Render

    return (
      <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '24px 16px', textAlign: 'center' }}>
        {/* ── Filters ── */}

        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{
            background: '#EDE5D5',
            borderRadius: '12px',
            padding: '20px 24px',
            
          }}>

            {/* Header row: title + sort dropdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#153448' }}>
                Building
              </h2>

              {/* Only show the sort dropdown if there's more than 1 review */}
              {reviews.length > 1 && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #948979',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}

              <h2 style={{ margin: 0, fontSize: '18px', color: '#153448' }}>
                Distance
              </h2>

              {/* Only show the sort dropdown if there's more than 1 review */}
              {reviews.length > 1 && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #948979',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#153448' }}>
                Floor
            </h2>

              {/* Only show the sort dropdown if there's more than 1 review */}
              {reviews.length > 1 && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #948979',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}

              <h2 style={{ margin: 0, fontSize: '18px', color: '#153448' }}>
                Status
              </h2>

              {/* Only show the sort dropdown if there's more than 1 review */}
              {reviews.length > 1 && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #948979',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>

              {/* Amenities Checkboxes*/}
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#153448' }}>
                Amenities
              </h2>
                {sampleCR.amenities.map((amenity) => (
                    <label>{amenity.label}: 
                      <input 
                        type="checkbox" 
                        name={amenity.label}
                        checked={inputs[amenity.label]} 
                        onChange={handleChange}
                        />
                      </label>
                ))}

            <div>
              <button onClick={() => handleSearch()} style={pillBtn('#e8f5e9', '#2e7d32')}>
                Search
              </button>
            </div>



          </div>
          
        </div>
      </div>
    )
};

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

export default CRPage;