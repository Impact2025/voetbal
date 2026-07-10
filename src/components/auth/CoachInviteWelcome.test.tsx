import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoachInviteWelcome from './CoachInviteWelcome';
import type { CoachInvite } from '../../lib/teamManagement';

const invite: CoachInvite = {
  id: 'tc-1',
  email: 'hello@bijeen.app',
  team_id: 'IMPACT-JO12-2',
  club_id: 'IMPACT-FC',
  role: 'head',
  team_name: 'Impact JO12-2',
};

const noop = () => {};

describe('CoachInviteWelcome', () => {
  it('noemt team en rol uit de uitnodiging', () => {
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={noop} />);
    expect(screen.getByText(/uitgenodigd als hoofdcoach van/i)).toBeInTheDocument();
    expect(screen.getByText('Impact JO12-2')).toBeInTheDocument();
  });

  it('toont de assistent-rol wanneer die is uitgenodigd', () => {
    render(
      <CoachInviteWelcome invite={{ ...invite, role: 'assistant' }} light onContinue={noop} onLogin={noop} />
    );
    expect(screen.getByText(/uitgenodigd als assistent-trainer van/i)).toBeInTheDocument();
  });

  it('toont het e-mailadres waaraan de uitnodiging vastzit', () => {
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={noop} />);
    expect(screen.getByText(/hello@bijeen\.app/)).toBeInTheDocument();
  });

  it('benoemt de e-mailbevestiging als aparte stap', () => {
    // mailer_autoconfirm staat uit: zonder deze stap denkt de coach dat hij klaar is.
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={noop} />);
    expect(screen.getByText('Bevestig je e-mailadres')).toBeInTheDocument();
  });

  it('toont de drie vervolgstappen op volgorde', () => {
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={noop} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Kies een wachtwoord');
    expect(items[1]).toHaveTextContent('Bevestig je e-mailadres');
    expect(items[2]).toHaveTextContent('Aan de slag');
  });

  it('roept onContinue aan vanaf de hoofdknop', async () => {
    const onContinue = vi.fn();
    render(<CoachInviteWelcome invite={invite} light onContinue={onContinue} onLogin={noop} />);
    await userEvent.click(screen.getByRole('button', { name: /account aanmaken/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('biedt bestaande gebruikers een weg naar inloggen', async () => {
    const onLogin = vi.fn();
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={onLogin} />);
    await userEvent.click(screen.getByRole('button', { name: /log hier in/i }));
    expect(onLogin).toHaveBeenCalledOnce();
  });
});
