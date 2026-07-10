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

  it('benadrukt dat geen wachtwoord nodig is (wachtwoordloze magic-link flow)', () => {
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={noop} />);
    expect(screen.getByText(/geen wachtwoord nodig/i)).toBeInTheDocument();
    expect(screen.queryByText('Bevestig je e-mailadres')).not.toBeInTheDocument();
    expect(screen.queryByText('Kies een wachtwoord')).not.toBeInTheDocument();
  });

  it('toont twee stappen: mail geopend + aan de slag', () => {
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={noop} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Mail geopend');
    expect(items[1]).toHaveTextContent('Aan de slag');
  });

  it('roept onContinue aan vanaf de hoofdknop', async () => {
    const onContinue = vi.fn();
    render(<CoachInviteWelcome invite={invite} light onContinue={onContinue} onLogin={noop} />);
    await userEvent.click(screen.getByRole('button', { name: /toegang activeren/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('biedt bestaande gebruikers een weg naar inloggen', async () => {
    const onLogin = vi.fn();
    render(<CoachInviteWelcome invite={invite} light onContinue={noop} onLogin={onLogin} />);
    await userEvent.click(screen.getByRole('button', { name: /log hier in/i }));
    expect(onLogin).toHaveBeenCalledOnce();
  });

  it('toont een spinner wanneer de uitnodiging wordt afgerond (claiming)', () => {
    render(<CoachInviteWelcome invite={invite} light claiming onContinue={noop} onLogin={noop} />);
    expect(screen.getByText(/even koppelen/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /toegang activeren/i })).not.toBeInTheDocument();
  });
});
