import { useState, useEffect } from 'react'
import ReviewCard from './ReviewCard'

const API = ''

const STATUS_OPTIONS = ['available', 'under maintenance', 'closed']

export default function AdminPage() {
  const [crs,          setCrs]          = useState([])
  const [reviews,      setReviews]      = useState([])
  const [crEdits,      setCrEdits]      = useState({})   // { [crId]: { status, tags: string[] } }
  const [allTags,      setAllTags]      = useState([])   // global tag library across all CRs
  const [newTagInput, setNewTagInput] = useState('')   // { [crId]: string } for the "add new tag" field
  const [selectedTagToDelete, setSelectedTagToDelete] = useState('') // for the remove tag
  const [confirmingTagDelete, setConfirmingTagDelete] = useState(false)
  const [saving,       setSaving]       = useState({})   // { [crId]: true } while saving
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  // CR filter state
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterFloor,    setFilterFloor]    = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')

  // Search results only updated when Search is clicked
  const [results, setResults] = useState([])
  const [crPage,  setCrPage]  = useState(1)


  const token     = localStorage.getItem('shiitake_token')
  const authHeader = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    async function load() {
      try {
        const [crsRes, revsRes, tagsRes] = await Promise.all([
          fetch(`${API}/crs`),
          fetch(`${API}/reviews`),
          fetch(`${API}/global-tags`),
        ])
        const crsData  = await crsRes.json()
        const revsData = await revsRes.json()
        const tagsData = await tagsRes.json()
        setCrs(crsData)
        setReviews(revsData)
        setAllTags(Array.isArray(tagsData) ? tagsData : [])

        // Pre-populate edit state from current DB values
        const edits = {}
        crsData.forEach(cr => {
          edits[cr.id] = {
            status: cr.status || 'available',
            tags:   Array.isArray(cr.tags) ? [...cr.tags] : [],
          }
        })
        setCrEdits(edits)
        setResults(crsData)
      } catch (err) {
        setError('Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSaveCR(crId) {
    setSaving(prev => ({ ...prev, [crId]: true }))
    try {
      const edit = crEdits[crId]
      const tags = edit.tags
      const res = await fetch(`${API}/crs/${crId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ status: edit.status, tags }),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      setCrs(prev => prev.map(cr => cr.id === crId ? data.cr : cr))
    } catch (err) {
      alert('Could not save CR. Please try again.')
    } finally {
      setSaving(prev => ({ ...prev, [crId]: false }))
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm('Delete this review permanently?')) return
    try {
      const res = await fetch(`${API}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!res.ok) throw new Error('Delete failed')
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (err) {
      alert('Could not delete review. Please try again.')
    }
  }

  async function handleClearReport(reviewId) {
    try {
      const res = await fetch(`${API}/reviews/${reviewId}/clear-report`, {
        method: 'PATCH',
        headers: authHeader,
      })
      if (!res.ok) throw new Error('Clear failed')
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reported: false } : r))
    } catch (err) {
      alert('Could not clear report. Please try again.')
    }
  }

  function updateEdit(crId, field, value) {
    setCrEdits(prev => ({ ...prev, [crId]: { ...prev[crId], [field]: value } }))
  }

  // Toggle a tag on/off for a specific CR
  function toggleTag(crId, tag) {
    setCrEdits(prev => {
      const current = prev[crId]?.tags || []
      const updated = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag]
      return { ...prev, [crId]: { ...prev[crId], tags: updated } }
    })
  }

  // Remove a tag from the global library and deselect it from all CR edits
  async function deleteTag(tag) {
    try {
      const res = await fetch(`${API}/global-tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!res.ok) throw new Error('Delete failed')
      setAllTags(prev => prev.filter(t => t !== tag))
      setCrEdits(prev => {
        const updated = {}
        Object.keys(prev).forEach(id => {
          updated[id] = { ...prev[id], tags: prev[id].tags.filter(t => t !== tag) }
        })
        return updated
      })
    } catch (err) {
      alert('Could not delete tag. Please try again.')
    }
  }

  // Add a new tag to the global library
  async function addNewTag() {
    const raw = newTagInput.trim()
    if (!raw || allTags.includes(raw)) return
    try {
      const res = await fetch(`${API}/global-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ name: raw }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 409) return // already exists — silently ignore
        throw new Error(data.error || 'Add failed')
      }
      setAllTags(prev => [...prev, raw].sort((a, b) => a.localeCompare(b)))
      setNewTagInput('')
    } catch (err) {
      alert('Could not add tag. Please try again.')
    }
  }

  const allBuildings = [...new Set(crs.map(cr => cr.building).filter(Boolean))].sort()

  function mapReview(r) {
    return {
      ...r,
      id: r.id ?? r.pk,
      text: r.comment ?? r.text ?? '',
      timestamp: r.createdAt ? r.createdAt.split('T')[0] : '',
      likes: r.likes ?? 0,
      dislikes: r.dislikes ?? 0,
    }
  }

  const CRS_PER_PAGE = 10

  function handleSearch() {
    let filtered = crs
    if (filterBuilding) {
      filtered = filtered.filter(cr => cr.building === filterBuilding)
    }
    if (filterFloor !== '') {
      filtered = filtered.filter(cr => cr.floor === Number(filterFloor))
    }
    if (filterStatus) {
      filtered = filtered.filter(cr => cr.status === filterStatus)
    }
    setResults(filtered)
    setCrPage(1)
  }

  const totalCRPages  = Math.ceil(results.length / CRS_PER_PAGE)
  const pageResults   = results.slice((crPage - 1) * CRS_PER_PAGE, crPage * CRS_PER_PAGE)

  if (loading) return <div style={pageStyle}>Loading...</div>
  if (error)   return <div style={pageStyle}>{error}</div>

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <h1 style={{ color: '#153448', marginBottom: '24px' }}>Admin Panel</h1>

        {/* ── CR MANAGEMENT ── */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>CR Management</h2>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Building</label>
              <select
                value={filterBuilding}
                onChange={e => setFilterBuilding(e.target.value)}
                style={inputStyle}
              >
                <option value=''>All buildings</option>
                {allBuildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Floor</label>
              <input
                type='number'
                value={filterFloor}
                onChange={e => setFilterFloor(e.target.value)}
                placeholder='Any'
                style={{ ...inputStyle, width: '80px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={inputStyle}
              >
                <option value=''>All statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button onClick={handleSearch} style={{ ...searchBtn }}>Search</button>
              <button
                onClick={() => { setFilterBuilding(''); setFilterFloor(''); setFilterStatus(''); setResults(crs); setCrPage(1) }}
                style={{ ...saveBtn, background: '#948979' }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Tag management row */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: confirmingTagDelete ? '0' : '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Add New Tag</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewTag() } }}
                  placeholder="Enter new tag…"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addNewTag} style={{ ...saveBtn, alignSelf: 'auto' }}>Add Tag</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Remove Tag from Library</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedTagToDelete}
                  onChange={e => setSelectedTagToDelete(e.target.value)}
                  style={inputStyle}
                >
                  <option value=''>Select a tag…</option>
                  {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={() => { if (selectedTagToDelete) setConfirmingTagDelete(true) }}
                  disabled={!selectedTagToDelete}
                  style={{ ...saveBtn, background: selectedTagToDelete ? '#c62828' : '#ccc', cursor: selectedTagToDelete ? 'pointer' : 'not-allowed', alignSelf: 'auto' }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Confirmation — spans full width below both tag columns */}
          {confirmingTagDelete && (
            <div style={{ padding: '10px 12px', marginBottom: '16px', background: '#fce4ec', borderRadius: '6px', fontSize: '13px', color: '#c62828' }}>
              Remove <strong>"{selectedTagToDelete}"</strong> from the library? This will deselect it from all CRs.
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => { deleteTag(selectedTagToDelete); setSelectedTagToDelete(''); setConfirmingTagDelete(false) }}
                  style={{ ...saveBtn, background: '#c62828', alignSelf: 'auto' }}
                >
                  Confirm Remove
                </button>
                <button
                  onClick={() => { setSelectedTagToDelete(''); setConfirmingTagDelete(false) }}
                  style={{ ...saveBtn, background: '#948979', alignSelf: 'auto' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {results.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>No CRs match the filters.</p>
          )}

          {pageResults.map(cr => (
            <CRRow
              key={cr.id}
              cr={cr}
              crEdit={crEdits[cr.id]}
              allTags={allTags}
              saving={!!saving[cr.id]}
              crReviews={reviews.filter(r => r.CRId === cr.id).map(mapReview)}
              onUpdateStatus={val => updateEdit(cr.id, 'status', val)}
              onToggleTag={tag => toggleTag(cr.id, tag)}
              onSave={() => handleSaveCR(cr.id)}
              onDeleteReview={handleDeleteReview}
            />
          ))}

          {totalCRPages > 1 && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
              {Array.from({ length: totalCRPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCrPage(p)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: p === crPage ? '#153448' : '#d9cdb8',
                    color:      p === crPage ? 'white'   : '#3a3020',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── REPORTED REVIEWS ── */}
        <section style={cardStyle}>
          <h2 style={sectionTitle}>Reported Reviews</h2>
          {reviews.filter(r => r.reported).length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '8px 0' }}>No reported reviews.</p>
          ) : (
            reviews.filter(r => r.reported).map(r => {
              const cr = crs.find(c => c.id === r.CRId)
              return (
                <div key={r.id} style={{ ...rowStyle, marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#948979', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cr ? `${cr.building} — ${cr.name}` : `CR #${r.CRId}`}
                  </div>
                  <ReviewCard
                    review={mapReview(r)}
                    currentUser={null}
                    currentVote={null}
                    isLoggedIn={true}
                    isAdmin={true}
                    onLike={() => {}}
                    onDislike={() => {}}
                    onEdit={() => {}}
                    onDelete={handleDeleteReview}
                    onReport={() => {}}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => handleClearReport(r.id)}
                      style={{ ...saveBtn, background: '#4CAF50' }}
                    >
                      Keep (Ignore Report)
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </section>

      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle = {
  minHeight: '100vh',
  background: '#DFD0B8',
  padding: '24px 16px',
}

const cardStyle = {
  background: '#EDE5D5',
  borderRadius: '12px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const sectionTitle = {
  margin: '0 0 16px',
  fontSize: '18px',
  color: '#153448',
}

const rowStyle = {
  background: 'white',
  border: '1px solid #DFD0B8',
  borderRadius: '8px',
  padding: '12px 14px',
  marginBottom: '10px',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#666',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #948979',
  fontSize: '13px',
  background: 'white',
  width: '100%',
  boxSizing: 'border-box',
}

const saveBtn = {
  padding: '6px 16px',
  background: '#153448',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  alignSelf: 'flex-end',
}

const searchBtn = {
  padding: '6px 16px',
  background: '#3a3a3a',
  color: 'white',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
}

// ── CRRow ─────────────────────────────────────────────────────────────────────
// Isolated component so toggling reviews only re-renders this row, not the page

const REVIEWS_PER_PAGE = 5

function CRRow({ cr, crEdit, allTags, saving, crReviews,
                 onUpdateStatus, onToggleTag, onSave, onDeleteReview }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [page, setPage] = useState(1)


  return (
    <div style={rowStyle}>

      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#153448' }}>
        {cr.building} — {cr.name}
      </div>

      {/* Status + Tags row */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' }}>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={crEdit?.status || 'available'}
              onChange={e => onUpdateStatus(e.target.value)}
              style={inputStyle}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            style={{ ...saveBtn, background: isExpanded ? '#948979' : '#3a3a3a', alignSelf: 'flex-start' }}
          >
            {isExpanded ? `Hide Reviews (${crReviews.length})` : `View Reviews (${crReviews.length})`}
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ ...saveBtn, alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Tags</label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {allTags.map(tag => {
              const active = (crEdit?.tags || []).includes(tag)
              return (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: active ? '#153448' : '#d9cdb8',
                    color:      active ? 'white'   : '#3a3020',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: '12px' }}
                  >
                    {active ? '✓ ' : ''}{tag}
                  </button>
                </span>
              )
            })}
          </div>

          {/* <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={newTagInput}
              onChange={e => onNewTagInputChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddNewTag() } }}
              placeholder="New tag…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={onAddNewTag}
              style={{ ...saveBtn, padding: '6px 12px' }}
            >
              Add
            </button>
          </div> */}
        </div>

      </div>

      {/* Inline reviews panel */}
      {isExpanded && (() => {
        const totalPages = Math.ceil(crReviews.length / REVIEWS_PER_PAGE)
        const pageReviews = crReviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE)
        return (
          <div style={{ marginTop: '14px', borderTop: '1px solid #DFD0B8', paddingTop: '12px' }}>
            {crReviews.length === 0 ? (
              <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '8px 0' }}>
                No reviews for this CR.
              </p>
            ) : (
              <>
                {pageReviews.map(r => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    currentUser={null}
                    currentVote={null}
                    isLoggedIn={true}
                    isAdmin={true}
                    onLike={() => {}}
                    onDislike={() => {}}
                    onEdit={() => {}}
                    onDelete={onDeleteReview}
                    onReport={() => {}}
                  />
                ))}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                          padding: '3px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: p === page ? '#153448' : '#d9cdb8',
                          color:      p === page ? 'white'   : '#3a3020',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}
