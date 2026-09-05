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
    window.history.pushState({}, '', '/');
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

  it('opens coach login view via the ?demo=coach link', () => {
    window.history.pushState({}, '', '/?demo=coach');
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    expect(screen.getByText('COACH LOGIN')).toBeInTheDocument();
  });

  it('opens coach login view directly on the /coach route', () => {
    window.history.pushState({}, '', '/coach');
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    expect(screen.getByText('COACH LOGIN')).toBeInTheDocument();
  });

  it('lets a player switch to coach login via the toggle link', () => {
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Log hier in' }));
    expect(screen.getByText('COACH LOGIN')).toBeInTheDocument();
  });

  it('shows a parent-login link when onParentLogin is provided', () => {
    const onParentLogin = vi.fn();
    render(<AuthComponent onPlayerLogin={onPlayerLogin} onParentLogin={onParentLogin} />);
    const parentLine = screen.getByText(/Ben je ouder\?/).closest('p')!;
    fireEvent.click(parentLine.querySelector('button')!);
    expect(onParentLogin).toHaveBeenCalled();
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

  it('coach login has no password field — only email + magic link', () => {
    window.history.pushState({}, '', '/?demo=coach');
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
    expect(screen.getByPlaceholderText('coach@email.com')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stuur inloglink/ })).toBeInTheDocument();
  });

  it('offers a passwordless magic-link login for coaches without a password', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    window.history.pushState({}, '', '/?demo=coach');
    render(<AuthComponent onPlayerLogin={onPlayerLogin} />);
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
