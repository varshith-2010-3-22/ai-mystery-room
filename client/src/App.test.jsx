import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { api } from './services/api';

describe('Mystery Room application flows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders home page with start action and detective concept', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /start an investigation/i })).toHaveAttribute('href', '/create');
    expect(screen.getByText(/every clue tells/i)).toBeInTheDocument();
  });

  it('renders create mystery page with premise input and difficulty options', () => {
    render(<MemoryRouter initialEntries={['/create']}><App /></MemoryRouter>);
    expect(screen.getByLabelText(/the premise/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate mystery/i })).toBeInTheDocument();
  });

  it('renders designed 404 page for unknown routes', () => {
    render(<MemoryRouter initialEntries={['/nowhere-lost']}><App /></MemoryRouter>);
    expect(screen.getByText(/this trail ends/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to the field office/i })).toHaveAttribute('href', '/');
  });

  it('renders accusation page, allows suspect selection, confirmation, and submission', async () => {
    const mockCase = {
      id: '507f1f77bcf86cd799439011',
      title: 'The Stolen Diamond',
      difficulty: 'easy',
      suspects: [
        { id: 's1', name: 'Alice Smith', role: 'Curator', description: 'Has the keys', alibi: 'In the office' },
        { id: 's2', name: 'Bob Jones', role: 'Security Guard', description: 'Patrolled the hall', alibi: 'At the desk' },
      ],
      progress: { discovered: 2, total: 5 },
      hintsUsed: 1,
      hintLimit: 2,
      status: 'active',
    };

    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { case: mockCase },
    });

    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        result: {
          id: '507f1f77bcf86cd799439011',
          verdict: 'solved',
          isCorrect: true,
          culprit: { id: 's1', name: 'Alice Smith', role: 'Curator' },
          explanation: 'Alice bypassed security with her master key.',
          score: { basePoints: 100, cluePoints: 10, hintPenalty: 10, finalScore: 100 },
          cluesDiscovered: 2,
          hintsUsed: 1,
          difficulty: 'easy',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/accuse/507f1f77bcf86cd799439011']}>
        <App />
      </MemoryRouter>
    );

    // Initial loading state
    expect(screen.getByText(/accessing case file/i)).toBeInTheDocument();

    // Loaded accusation page
    await waitFor(() => {
      expect(screen.getByText(/accuse a/i)).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /submit final accusation/i });
    expect(submitBtn).toBeDisabled();

    // Select Alice Smith
    const aliceRadio = screen.getByLabelText(/accuse alice smith/i);
    fireEvent.click(aliceRadio);

    // Confirmation box is shown
    expect(screen.getByText(/you are formally naming/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled(); // still disabled without checkbox

    // Check confirmation checkbox
    const confirmCheckbox = screen.getByRole('checkbox');
    fireEvent.click(confirmCheckbox);
    expect(submitBtn).not.toBeDisabled();

    // Click submit
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/cases/507f1f77bcf86cd799439011/accuse', {
        suspectId: 's1',
      });
    });
  });

  it('renders error notice and retry on accusation loading failure', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce({
      response: { data: { error: { message: 'Failed to retrieve case file.' } } },
    });

    render(
      <MemoryRouter initialEntries={['/accuse/507f1f77bcf86cd799439011']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to retrieve case file/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('renders results page with verdict and score breakdown', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        result: {
          id: '507f1f77bcf86cd799439011',
          verdict: 'solved',
          isCorrect: true,
          culprit: { id: 's1', name: 'Alice Smith', role: 'Curator' },
          explanation: 'Alice used her key to access the case.',
          score: { basePoints: 100, cluePoints: 10, hintPenalty: 10, finalScore: 100 },
          cluesDiscovered: 2,
          hintsUsed: 1,
          difficulty: 'easy',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/results/507f1f77bcf86cd799439011']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/case solved/i)).toBeInTheDocument();
      expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
      expect(screen.getAllByText(/100/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('link', { name: /play another case/i })).toBeInTheDocument();
    });
  });
});
