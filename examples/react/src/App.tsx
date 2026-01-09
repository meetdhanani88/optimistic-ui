import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoList } from './TodoList';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Optimistic UI Example</h1>
        <TodoList />
      </div>
    </QueryClientProvider>
  );
}

export default App;

