import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import App from './App';

test('join screen asks only for a name and enables DOŁĄCZ once one is typed', () => {
  const { getByText, getByRole } = render(<App />);
  expect(getByText(/jak masz na imię\?/i)).toBeInTheDocument();
  expect(getByText(/zeskanujcie, żeby dołączyć/i)).toBeInTheDocument();

  const join = getByRole('button', { name: /dołącz/i });
  expect(join).toBeDisabled();

  fireEvent.change(getByRole('textbox'), { target: { value: 'Ania' } });
  expect(join).toBeEnabled();
});
