// frontend/src/pages/Index.test.jsx
import { render, screen } from '@testing-library/react';
import Index from './Index';

test('renders editor', () => {
  render(<Index />);
  const editorElement = screen.getByPlaceholderText(/Type your Markdown here.../i);
  expect(editorElement).toBeInTheDocument();
});
