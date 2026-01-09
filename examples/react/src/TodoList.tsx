import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from '@meetdhanani/optimistic-ui';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

async function fetchTodos(): Promise<Todo[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    { id: '1', title: 'Learn React', completed: false },
    { id: '2', title: 'Build something', completed: true },
  ];
}

export function TodoList() {
  
  // Error simulation state
  const [shouldFailCreate, setShouldFailCreate] = useState(false);
  const [shouldFailUpdate, setShouldFailUpdate] = useState(false);
  const [shouldFailDelete, setShouldFailDelete] = useState(false);
  
  // Mock API functions with error simulation
  const createTodo = async (todo: Todo): Promise<Todo> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate API failure
    if (shouldFailCreate) {
      setShouldFailCreate(false); // Reset after failure
      throw new Error('Failed to create todo: Network error');
    }
    
    return { ...todo, id: Math.random().toString(36).substring(7) };
  };

  const updateTodo = async (todo: Todo): Promise<Todo> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Simulate API failure
    if (shouldFailUpdate) {
      setShouldFailUpdate(false); // Reset after failure
      throw new Error('Failed to update todo: Server error');
    }
    
    return todo;
  };

  const deleteTodo = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    // Simulate API failure
    if (shouldFailDelete) {
      setShouldFailDelete(false); // Reset after failure
      throw new Error('Failed to delete todo: Permission denied');
    }
  };

  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });
  const createMutation = useOptimisticCreate<Todo>({
    queryKey: ['todos'],
    newItem: { id: '', title: '', completed: false },
    mutationFn: createTodo,
  });

  const updateMutation = useOptimisticUpdate<Todo>({
    queryKey: ['todos'],
    id: '',
    updater: (todo) => ({ ...todo, completed: !todo.completed }),
    mutationFn: updateTodo,
  });

  const deleteMutation = useOptimisticDelete<Todo>({
    queryKey: ['todos'],
    id: '',
    mutationFn: deleteTodo,
  });

  const handleCreate = () => {
    const title = prompt('Enter todo title:');
    if (title) {
      createMutation.mutate({ id: '', title, completed: false });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Error Simulation Controls</h3>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={shouldFailCreate}
            onChange={(e) => setShouldFailCreate(e.target.checked)}
          />
          {' '}Fail Create
        </label>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={shouldFailUpdate}
            onChange={(e) => setShouldFailUpdate(e.target.checked)}
          />
          {' '}Fail Update
        </label>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            checked={shouldFailDelete}
            onChange={(e) => setShouldFailDelete(e.target.checked)}
          />
          {' '}Fail Delete
        </label>
        <p style={{ fontSize: '0.9em', color: '#666', margin: '0.5rem 0 0 0' }}>
          When enabled, the next operation will fail and the optimistic update should rollback.
        </p>
      </div>
      
      <button onClick={handleCreate} style={{ marginBottom: '1rem' }}>
        Add Todo
      </button>
      
      {/* Error messages */}
      {createMutation.isError && (
        <div style={{ padding: '0.5rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>
          ❌ Create failed: {createMutation.error?.message}. Item should be rolled back.
        </div>
      )}
      {updateMutation.isError && (
        <div style={{ padding: '0.5rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>
          ❌ Update failed: {updateMutation.error?.message}. Changes should be rolled back.
        </div>
      )}
      {deleteMutation.isError && (
        <div style={{ padding: '0.5rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>
          ❌ Delete failed: {deleteMutation.error?.message}. Item should be restored.
        </div>
      )}
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos?.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem',
              border: '1px solid #ccc',
              marginBottom: '0.5rem',
              borderRadius: '4px',
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => updateMutation.mutate({ ...todo, completed: !todo.completed })}
            />
            <span style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.title}
            </span>
            <button onClick={() => deleteMutation.mutate(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      
      {/* Status indicators */}
      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
        {createMutation.isPending && <div>⏳ Creating...</div>}
        {updateMutation.isPending && <div>⏳ Updating...</div>}
        {deleteMutation.isPending && <div>⏳ Deleting...</div>}
        {createMutation.isSuccess && <div style={{ color: 'green' }}>✅ Create succeeded</div>}
        {updateMutation.isSuccess && <div style={{ color: 'green' }}>✅ Update succeeded</div>}
        {deleteMutation.isSuccess && <div style={{ color: 'green' }}>✅ Delete succeeded</div>}
      </div>
    </div>
  );
}

