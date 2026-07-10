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
      resend: vi.fn().mockResolvedValue({ error: null }),
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

  it('translates "Email not confirmed" to Dutch and offers a resend button', async () => {
    const { supabase } = await import('../../lib/supabase');
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ error: { message: 'Email not confirmed' } });

    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    fireEvent.click(screen.getByText('Coach'));
    fireEvent.change(screen.getByPlaceholderText('coach@email.com'), { target: { value: 'hans@fellow-travellers.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wachtwoord123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));

    await waitFor(() => {
      expect(screen.getByText(/Je e-mailadres is nog niet bevestigd/)).toBeInTheDocument();
    });
    const resendBtn = screen.getByRole('button', { name: 'Bevestigingsmail opnieuw versturen' });
    expect(resendBtn).toBeInTheDocument();

    fireEvent.click(resendBtn);
    await waitFor(() => {
      expect(supabase.auth.resend).toHaveBeenCalledWith(expect.objectContaining({
        type: 'signup',
        email: 'hans@fellow-travellers.com',
      }));
      expect(screen.getByText(/Bevestigingsmail opnieuw verstuurd/)).toBeInTheDocument();
    });
  });

  it('offers a passwordless magic-link login for coaches without a password', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    fireEvent.click(screen.getByText('Coach'));
    fireEvent.change(screen.getByPlaceholderText('coach@email.com'), { target: { value: 'wim@fellow-travellers.com' } });

    const magicBtn = screen.getByRole('button', { name: /Stuur inloglink/ });
    expect(magicBtn).toBeInTheDocument();
    fireEvent.click(magicBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/send-login-link', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'wim@fellow-travellers.com' }),
      }));
      expect(screen.getByText(/Inloglink verstuurd/)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
