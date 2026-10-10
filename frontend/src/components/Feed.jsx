import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import './Feed.css';

function FeedbackImageCarousel({ images, postId }) {
  const [activeImage, setActiveImage] = useState(0);
  useEffect(() => setActiveImage(index => Math.min(index, images.length - 1)), [images.length]);
  if (!images.length) return null;

  const showImage = index => setActiveImage((index + images.length) % images.length);

  return (
    <section className="post-image-carousel" aria-label={`${images.length} attached ${images.length === 1 ? 'image' : 'images'}`}>
      <img
        className="feedback-image"
        src={images[activeImage]}
        alt={`Image ${activeImage + 1} of ${images.length} attached to this campus feedback`}
        loading="lazy"
      />
      {images.length > 1 && <>
        <button className="carousel-arrow carousel-previous" type="button" onClick={() => showImage(activeImage - 1)} aria-label="Show previous image"><Icon name="chevronLeft" size={23} /></button>
        <button className="carousel-arrow carousel-next" type="button" onClick={() => showImage(activeImage + 1)} aria-label="Show next image"><Icon name="chevronRight" size={23} /></button>
        <div className="carousel-controls">
          <span className="carousel-count" aria-live="polite">{activeImage + 1} / {images.length}</span>
          <div className="carousel-indicators" role="group" aria-label="Choose an image">
            {images.map((_, index) => <button
              key={`${postId}-indicator-${index}`}
              type="button"
              className={`carousel-indicator ${activeImage === index ? 'active' : ''}`}
              onClick={() => showImage(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={activeImage === index ? 'true' : undefined}
            />)}
          </div>
        </div>
      </>}
    </section>
  );
}

const typeLabels = { feedback: 'Feedback', idea: 'Idea', discussion: 'Discussion', moment: 'Campus moment', poll: 'Poll' };
const reactions = [['agree', 'heart', 'Agree'], ['relate', 'message', 'Relate'], ['helpful', 'sparkle', 'Helpful'], ['congrats', 'impact', 'Congrats']];
const availableTopics = ['Study life', 'Clubs', 'Food', 'Events', 'Wellbeing', 'Campus life'];

function WeeklyHighlight({ post }) {
  if (!post) return <section className="highlight-card"><div className="highlight-badge"><Icon name="sparkle" size={15} /> COMMUNITY FEED</div><h2>Your campus story starts here</h2><p>Share an idea, ask the campus, or post a moment from your week.</p></section>;
  return <section className="highlight-card"><div className="highlight-badge"><Icon name="sparkle" size={15} /> THIS WEEK IN ECHOBOX</div><h2>{post.content.length > 95 ? post.content.slice(0, 95) + '...' : post.content}</h2><p>{typeLabels[post.postType || 'feedback']} | {post.tag} | {post.commentList?.length || 0} comments | {post.upvotedBy?.length || 0} supporters</p><a href={`#post-${post._id}`}>Join the conversation</a></section>;
}

function Poll({ post, onVote, currentUser }) {
  if (!post.poll?.question) return null;
  const totalVotes = post.poll.options.reduce((sum, option) => sum + option.votes, 0);
  return <section className="post-poll"><h3>{post.poll.question}</h3>{post.poll.options.map(option => {
    const percent = totalVotes ? Math.round(option.votes / totalVotes * 100) : 0;
    return <button type="button" key={option._id} className={`poll-result ${post.poll.myVote === option._id ? 'selected' : ''}`} onClick={() => onVote(post._id, option._id)} disabled={!currentUser || post.poll.isClosed} aria-pressed={post.poll.myVote === option._id}>
      <span className="poll-result-fill" style={{ width: `${percent}%` }} /><span className="poll-result-label">{option.label}</span><strong>{percent}%</strong>
    </button>;
  })}<small>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} | {post.poll.isClosed ? 'Poll closed | final results' : currentUser ? 'Select an option to vote or change your vote.' : 'Sign in to vote.'}</small>{post.poll.closesAt && !post.poll.isClosed && <small>Closes {new Date(post.poll.closesAt).toLocaleDateString()}</small>}{post.poll.isClosed && <Link to={`/polls/${post._id}/results`}>View poll results</Link>}</section>;
}

export default function Feed({ posts, onUpvote, onDownvote, onReport, onAddComment, onFollow, onSave, onFollowTopic, onReaction, onPollVote, onEdit, onCreatePost, selectedPostType, setSelectedPostType, selectedTopic, setSelectedTopic, savedOnly, setSavedOnly, weeklyHighlight, currentUser, loading, error, onRetry, feedMode, setFeedMode, setSortMode, popularTopics = [], featuredPoll, isSavedPage = false }) {
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const toggleComments = (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setCommentText("");
      setReplyTo(null);
    }
  };

  const submitComment = (e, postId) => {
    e.preventDefault();
    if(commentText.trim()) {
      onAddComment(postId, commentText, replyTo?._id || '');
      setCommentText("");
      setReplyTo(null);
    }
  };

  return (
    <main className="feed-container">
      <div className={`feed-layout ${isSavedPage ? 'saved-feed-layout' : ''}`}>
      <div className="feed-content">
        {isSavedPage && <header className="saved-page-heading"><span className="rail-eyebrow">YOUR LIBRARY</span><h1>Saved posts</h1><p>Posts you bookmarked to come back to.</p></header>}
        {!isSavedPage && <>
        <WeeklyHighlight post={weeklyHighlight} />
        <section className="feed-composer" aria-label="Create a post">
          <div className="composer-avatar" aria-hidden="true">{currentUser?.username?.slice(0, 1).toUpperCase() || 'E'}</div>
          <button className="composer-prompt" type="button" onClick={() => onCreatePost('feedback')}>Share something with campus...</button>
          <div className="composer-quick-actions">
            <button type="button" onClick={() => onCreatePost('feedback')}><Icon name="category" size={15} /> Feedback</button>
            <button type="button" onClick={() => onCreatePost('idea')}><Icon name="idea" size={15} /> Idea</button>
            <button type="button" onClick={() => onCreatePost('discussion')}><Icon name="message" size={15} /> Discuss</button>
            <button type="button" onClick={() => onCreatePost('poll')}><Icon name="poll" size={15} /> Poll</button>
          </div>
        </section>
        </>}
        <div className="feed-toolbar">
          {!isSavedPage && <div className="feed-mode-tabs" role="tablist" aria-label="Choose feed">
            {[[ 'for-you', 'For you' ], [ 'latest', 'Latest' ], [ 'following', 'Following' ]].map(([mode, label]) => <button key={mode} type="button" role="tab" aria-selected={feedMode === mode} className={feedMode === mode ? 'active' : ''} onClick={() => { setFeedMode(mode); setSortMode(mode === 'for-you' ? 'top' : 'newest'); }}>{label}</button>)}
          </div>}
          <section className="community-filters" aria-label="Community feed filters">
            <label>Type<select value={selectedPostType} onChange={event => setSelectedPostType(event.target.value)}><option value="all">Everything</option><option value="feedback">Feedback</option><option value="idea">Ideas</option><option value="discussion">Discussions</option><option value="moment">Campus moments</option><option value="poll">Polls</option></select></label>
            <label>Topic<select value={selectedTopic} onChange={event => setSelectedTopic(event.target.value)}><option value="all">All topics</option>{availableTopics.map(topic => <option key={topic} value={topic}>{topic}</option>)}</select></label>
            {currentUser && !isSavedPage && <button type="button" className={savedOnly ? 'active' : ''} onClick={() => setSavedOnly(value => !value)} aria-pressed={savedOnly}>{savedOnly ? 'Saved only' : 'Saved'}</button>}
            {currentUser && <label className="follow-topic-control">Follow topic<select value="" onChange={event => { if (event.target.value) onFollowTopic(event.target.value); }}><option value="">Choose</option>{availableTopics.filter(topic => !currentUser.followedTopics?.includes(topic)).map(topic => <option key={topic}>{topic}</option>)}</select></label>}
          </section>
          {currentUser?.followedTopics?.length > 0 && <div className="followed-topic-list"><span>Following topics</span>{currentUser.followedTopics.map(topic => <button key={topic} type="button" className={selectedTopic === topic ? 'active' : ''} onClick={() => setSelectedTopic(selectedTopic === topic ? 'all' : topic)}>{topic}</button>)}</div>}
        </div>
        {/* Feedback Posts */}
        <div className="posts-list">
          {loading ? (
            <div className="feed-state" role="status">Loading posts…</div>
          ) : error ? (
            <div className="feed-state feed-state-error" role="alert">{error}<button onClick={onRetry}>Retry</button></div>
          ) : posts.length === 0 ? (
            <div className="feed-state">{isSavedPage ? 'You have no saved posts yet. Save a post from the feed and it will appear here.' : 'No posts found. Try adjusting your filters or be the first to share.'}</div>
          ) : (
            posts.map(post => {
              const hasUpvoted = currentUser ? post.upvotedBy.includes(currentUser._id) : false;
              const hasDownvoted = currentUser ? post.downvotedBy.includes(currentUser._id) : false;
              const isFollowing = currentUser?.followedPosts?.includes(post._id) || false;
              const isExpanded = expandedPostId === post._id;
              const comments = post.commentList || [];
              const postImages = [...(post.images || []), ...(post.image && !(post.images || []).includes(post.image) ? [post.image] : [])];

              return (
              <article key={post._id} id={`post-${post._id}`} className="post-card">
                <div className="post-badges"><span className="post-tag">{post.tag}</span><span className="post-type-badge">{typeLabels[post.postType || 'feedback']}</span>{['feedback', 'idea'].includes(post.postType || 'feedback') && <span className={`post-status post-status-${post.status || 'submitted'}`}>{(post.status || 'submitted').replace('-', ' ')}</span>}</div>
                {post.author && <div className="post-author">{post.visibility === 'named' && post.author.profilePhoto && <img src={post.author.profilePhoto} alt="" />}{post.visibility === 'alias' ? `@${post.author.username}` : post.author.username}</div>}
                {['feedback', 'idea'].includes(post.postType || 'feedback') && post.statusHistory?.length > 1 && <details className="post-status-history"><summary>Update history</summary><ol>{post.statusHistory.slice(-4).map((update, index) => <li key={`${update.status}-${update.updatedAt}-${index}`}><strong>{update.status.replace('-', ' ')}</strong><time>{new Date(update.updatedAt).toLocaleDateString()}</time></li>)}</ol></details>}
                <p className="post-content">{post.content}</p>
                {post.status === 'resolved' && post.resolutionNote && <aside className="post-resolution-update"><strong>Campus resolution update</strong><p>{post.resolutionNote}</p></aside>}
                {post.canEdit && post.editHistory?.length > 0 && <details className="post-edit-history"><summary>Edited · view history</summary><ol>{post.editHistory.slice(-5).reverse().map((edit, index) => <li key={`${edit.editedAt}-${index}`}><time>{new Date(edit.editedAt).toLocaleString()}</time><p>{edit.content}</p></li>)}</ol></details>}
                {post.topics?.length > 0 && <div className="post-topic-tags">{post.topics.map(topic => <button key={topic} type="button" onClick={() => setSelectedTopic(topic)}>{topic}</button>)}</div>}
                {postImages.length > 0 && <FeedbackImageCarousel images={postImages} postId={post._id} />}
                <Poll post={post} onVote={onPollVote} currentUser={currentUser} />
                {post.adminReplies?.length > 0 && <section className="post-updates" aria-label="Official updates"><div className="post-updates-heading"><strong>Official updates</strong><span>{post.adminReplies.length}</span></div><div className="post-updates-list">{post.adminReplies.map(reply => <article className="admin-reply" key={reply._id}><div className="admin-reply-heading"><strong>EchoBox Admin | @{reply.adminUsername}</strong><time>{new Date(reply.createdAt).toLocaleString()}</time></div><p>{reply.text}</p></article>)}</div></section>}
                
                <div className="post-metrics">
                  {['feedback', 'idea'].includes(post.postType || 'feedback') && <button 
                    className={`metric ${hasUpvoted ? 'active-vote' : ''}`} 
                    onClick={() => onUpvote(post._id)}
                    aria-label={`${hasUpvoted ? 'Remove support' : 'Support this post'}; ${post.upvotedBy.length} supporters`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={hasUpvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    {post.postType === 'idea' ? `Support ${post.upvotedBy.length}` : post.upvotedBy.length}
                  </button>}
                  {(post.postType || 'feedback') === 'feedback' && <button 
                    className={`metric ${hasDownvoted ? 'active-vote' : ''}`} 
                    onClick={() => onDownvote(post._id)}
                    aria-label={`${hasDownvoted ? 'Remove downvote' : 'Downvote'}; ${post.downvotedBy.length} downvotes`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={hasDownvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2"></path>
                    </svg>
                    {post.downvotedBy.length}
                  </button>}
                  {(post.postType || 'feedback') !== 'feedback' && <div className="post-reactions">{reactions.map(([kind, icon, label]) => <button type="button" key={kind} className={post.myReaction === kind ? 'active' : ''} onClick={() => onReaction(post._id, kind)} aria-pressed={post.myReaction === kind} aria-label={`${label}, ${post.reactions?.[kind] || 0}`}><Icon name={icon} size={15} /> {post.reactions?.[kind] || 0}</button>)}</div>}
                  <button className="metric" onClick={() => toggleComments(post._id)} aria-expanded={isExpanded} aria-label={`${isExpanded ? 'Hide' : 'Show'} ${comments.length} comments`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    {comments.length} Comments
                  </button>
                  <button className="metric" onClick={() => onReport(post._id)} aria-label="Report feedback">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                      <line x1="4" y1="22" x2="4" y2="15"></line>
                    </svg>
                    Report
                  </button>
                  {post.canEdit && <button className="metric edit-post-action" onClick={() => onEdit(post)}>Edit</button>}
                  {currentUser && <button className="metric" onClick={() => onSave(post._id)} aria-pressed={post.isSaved}>{post.isSaved ? 'Saved' : 'Save'}</button>}
                  <button className={`metric follow-metric ${isFollowing ? 'active-vote' : ''}`} onClick={() => onFollow(post._id)} aria-pressed={isFollowing}>{isFollowing ? 'Following' : 'Follow updates'}</button>
                </div>
                
                {isExpanded && (
                  <div className="comments-section">
                    {comments.length === 0 ? (
                      <div className="no-comments">No comments yet. Be the first to share your thoughts!</div>
                    ) : (
                      comments.filter(c => !c.parentCommentId).map(c => <div key={c._id || c.id} className="comment-thread">
                        <div className="comment-item"><span className="comment-author">@{c.author}</span><span className="comment-text">{c.text}</span>{currentUser && <button type="button" className="comment-reply-button" onClick={() => setReplyTo(c)}>Reply</button>}</div>
                        {comments.filter(reply => reply.parentCommentId === (c._id || c.id)).map(reply => <div key={reply._id || reply.id} className="comment-item comment-reply-item"><span className="comment-author">@{reply.author}</span><span className="comment-text">{reply.text}</span></div>)}
                      </div>)
                    )}
                    {replyTo && <div className="comment-replying">Replying to @{replyTo.author}<button type="button" onClick={() => setReplyTo(null)}>Cancel reply</button></div>}
                    
                    <form className="comment-input-container" onSubmit={(e) => submitComment(e, post._id)}>
                      <input 
                        type="text" 
                        className="comment-input" 
                        aria-label="Write a comment"
                        placeholder={currentUser ? "Write a comment..." : "Login to join the discussion"}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={!currentUser}
                      />
                      <button type="submit" className="comment-submit" disabled={!currentUser || !commentText.trim()}>Post</button>
                    </form>
                  </div>
                )}
                
              </article>
            )})
          )}
        </div>
      </div>
      {!isSavedPage && <aside className="feed-side-rail" aria-label="Campus community">
        <section className="rail-card rail-welcome">
          <span className="rail-eyebrow">YOUR CAMPUS, HEARD</span>
          <h2>A campus conversation that moves things forward.</h2>
          <p>Share ideas, ask questions, and keep up with what students care about.</p>
          <button type="button" onClick={() => onCreatePost('idea')}>Share an idea <Icon name="arrowRight" size={15} /></button>
        </section>
        <section className="rail-card">
          <div className="rail-section-heading"><div><span className="rail-eyebrow">THE COMMUNITY</span><h3>Trending topics</h3></div><Icon name="impact" size={16} /></div>
          {popularTopics.length ? <div className="trending-topic-list">{popularTopics.map(([topic, count], index) => <button type="button" key={topic} onClick={() => setSelectedTopic(topic)}><span className="topic-rank">0{index + 1}</span><span className="topic-name">{topic}<small>{count} {count === 1 ? 'post' : 'posts'}</small></span><Icon className="topic-arrow" name="arrowRight" size={14} /></button>)}</div> : <p className="rail-empty">Topics will appear as people start posting.</p>}
        </section>
        <section className="rail-card rail-poll-card">
          <div className="rail-section-heading"><div><span className="rail-eyebrow">CAMPUS PULSE</span><h3>Quick poll</h3></div><Icon name="poll" size={16} /></div>
          {featuredPoll ? <><p className="rail-poll-question">{featuredPoll.poll.question}</p><span className="rail-poll-meta">{featuredPoll.poll.options.reduce((sum, option) => sum + option.votes, 0)} votes | {featuredPoll.tag}</span><a href={`#post-${featuredPoll._id}`}>View poll <Icon name="arrowRight" size={13} /></a></> : <><p className="rail-empty">Ask the campus and see what everyone thinks.</p><button type="button" className="rail-outline-action" onClick={() => onCreatePost('poll')}>Create a poll <Icon name="arrowRight" size={13} /></button></>}
        </section>
        <p className="rail-privacy-note"><Icon name="shield" size={16} /> Post anonymously, as your alias, or with your profile.</p>
      </aside>}
      </div>
    </main>
  );
}
