import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthComponent from './AuthComponent';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    // Speler-login haalt spelers per team op: from('players').select('*').eq('team_id', …)
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null }),
    },
  },
}));

describe('AuthComponent', () => {
  const onPlayerLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders speler login tab by default', () => {
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    expect(screen.getByText('SPELER LOGIN')).toBeInTheDocument();
  });

  it('shows error when teamId or pin is empty', async () => {
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
    await waitFor(() => {
      expect(screen.getByText('Team ID en Pincode zijn beide verplicht.')).toBeInTheDocument();
    });
  });

  it('switches to coach login tab', () => {
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    fireEvent.click(screen.getByText('Coach'));
    expect(screen.getByText('COACH LOGIN')).toBeInTheDocument();
  });

  it('shows "team not found" error when no players match the team', async () => {
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    fireEvent.change(screen.getByPlaceholderText('Vraag je coach'), { target: { value: 'TEAM1' } });
    fireEvent.change(screen.getByPlaceholderText('6-cijferige code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
    await waitFor(() => {
      expect(screen.getByText('Team ID niet gevonden. Controleer de code bij je coach.')).toBeInTheDocument();
    });
  });
});
