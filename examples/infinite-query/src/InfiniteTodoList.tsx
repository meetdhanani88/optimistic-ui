import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useOptimisticCreate } from '@meetdhanani/optimistic-ui';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface PostPage {
  posts: Post[];
  nextPage: number | null;
  total: number;
}

// Real API: JSONPlaceholder (https://jsonplaceholder.typicode.com/)
// Supports GET and POST operations
async function fetchPosts({ pageParam = 1 }): Promise<PostPage> {
  const limit = 10;
  const start = (pageParam - 1) * limit;
  
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_start=${start}&_limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  
  const posts: Post[] = await response.json();
  
  // Get total count (approximate - JSONPlaceholder has 100 posts)
  const total = 100;
  const hasMore = start + limit < total;
  
  return {
    posts,
    nextPage: hasMore ? pageParam + 1 : null,
    total,
  };
}

export function InfiniteCharacterList() {
  // Error simulation state
  const [shouldFailCreate, setShouldFailCreate] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  // Real API call - JSONPlaceholder supports POST
  const createPost = async (post: Post): Promise<Post> => {
    // Simulate network delay (like a real API call)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate API failure for testing (after delay, like a real network timeout)
    if (shouldFailCreate) {
      setShouldFailCreate(false);
      // Simulate network error after delay
      throw new Error('Failed to create post: Network timeout');
    }
    
    // Real POST request to JSONPlaceholder
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: post.title,
        body: post.body,
        userId: post.userId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
    }
    
    // API returns the created post with server-generated ID
    return await response.json();
  };

  const createMutation = useOptimisticCreate<Post>({
    queryKey: ['posts'],
    newItem: { id: 0, title: '', body: '', userId: 1 },
    mutationFn: createPost,
  });

  const handleCreate = () => {
    const title = prompt('Enter post title:');
    if (title) {
      const body = prompt('Enter post body:') || '';
      createMutation.mutate({ 
        id: 0, 
        title, 
        body,
        userId: 1
      });
    }
  };

  const posts = data?.pages
    .flatMap((page) => {
      // Handle both array pages and object pages
      if (Array.isArray(page)) {
        return page;
      }
      if (page && typeof page === 'object' && 'posts' in page) {
        return (page as PostPage).posts || [];
      }
      return [];
    })
    .filter((post): post is Post => post != null && typeof post === 'object' && 'title' in post) ?? [];

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading posts...</div>;
  }

  if (isError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#c00' }}>
        ❌ Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Infinite Query Example - JSONPlaceholder API</h3>
        <p style={{ fontSize: '0.9em', color: '#666', margin: '0.5rem 0' }}>
          This demonstrates optimistic updates with infinite queries using a real API that supports POST. 
          New posts are added optimistically to the first page.
        </p>
        <p style={{ fontSize: '0.85em', color: '#888', margin: '0.5rem 0', fontStyle: 'italic' }}>
          API: <a href="https://jsonplaceholder.typicode.com" target="_blank" rel="noopener noreferrer">jsonplaceholder.typicode.com</a>
        </p>
        <label style={{ display: 'block', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            checked={shouldFailCreate}
            onChange={(e) => setShouldFailCreate(e.target.checked)}
          />
          {' '}Fail Create (test rollback)
        </label>
      </div>

      <button 
        onClick={handleCreate} 
        style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem 1rem',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ➕ Add Post
      </button>

      {/* Error messages */}
      {createMutation.isError && (
        <div style={{ padding: '0.5rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>
          ❌ Create failed: {createMutation.error?.message}. Item should be rolled back.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.map((post) => {
          if (!post || !post.title) return null;
          return (
            <div
              key={post.id}
              style={{
                padding: '1.5rem',
                border: '1px solid #ccc',
                borderRadius: '8px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2em', color: '#333' }}>
                {post.title}
              </h3>
              <p style={{ margin: '0.5rem 0', color: '#666', lineHeight: '1.5' }}>
                {post.body}
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85em', color: '#888' }}>
                Post ID: {post.id} • User ID: {post.userId}
              </div>
            </div>
          );
        })}
      </div>

      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()} 
          disabled={isFetchingNextPage} 
          style={{ 
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: isFetchingNextPage ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isFetchingNextPage ? 'not-allowed' : 'pointer',
            display: 'block',
            margin: '2rem auto 0',
          }}
        >
          {isFetchingNextPage ? '⏳ Loading...' : '📄 Load More Posts'}
        </button>
      )}

      {/* Status indicators */}
      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666', textAlign: 'center' }}>
        {createMutation.isPending && <div>⏳ Creating post...</div>}
        {createMutation.isSuccess && <div style={{ color: 'green' }}>✅ Post created successfully</div>}
        {data && (
          <div style={{ marginTop: '0.5rem' }}>
            Showing {posts.length} posts (Page {data.pages.length})
          </div>
        )}
      </div>
    </div>
  );
}

