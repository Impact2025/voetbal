import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewConvEmptyState } from './MessagingInbox';

const noop = () => {};

describe('NewConvEmptyState', () => {
  it('toont de foutmelding en een werkende retry-knop', async () => {
    const onRetry = vi.fn();
    render(
      <NewConvEmptyState
        error="permission denied for function get_club_trainer_emails"
        pendingInvites={0}
        allInConversation={false}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Contacten laden mislukt')).toBeInTheDocument();
    expect(screen.getByText(/permission denied/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /opnieuw proberen/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('legt uit dat een uitgenodigde trainer nog niet heeft ingelogd', () => {
    render(
      <NewConvEmptyState error={null} pendingInvites={1} allInConversation={false} onRetry={noop} />
    );
    expect(screen.getByText(/1 trainer is uitgenodigd, maar heeft nog niet ingelogd/)).toBeInTheDocument();
  });

  it('gebruikt meervoud bij meerdere openstaande uitnodigingen', () => {
    render(
      <NewConvEmptyState error={null} pendingInvites={3} allInConversation={false} onRetry={noop} />
    );
    expect(screen.getByText(/3 trainers zijn uitgenodigd, maar hebben nog niet ingelogd/)).toBeInTheDocument();
  });

  it('een fout heeft voorrang op openstaande uitnodigingen', () => {
    render(
      <NewConvEmptyState error="netwerkfout" pendingInvites={2} allInConversation={false} onRetry={noop} />
    );
    expect(screen.getByText('Contacten laden mislukt')).toBeInTheDocument();
    expect(screen.queryByText(/uitgenodigd/)).not.toBeInTheDocument();
  });

  it('meldt wanneer met alle contacten al een gesprek loopt', () => {
    render(
      <NewConvEmptyState error={null} pendingInvites={0} allInConversation onRetry={noop} />
    );
    expect(screen.getByText('Iedereen zit al in een gesprek')).toBeInTheDocument();
  });

  it('valt terug op de neutrale lege staat', () => {
    render(
      <NewConvEmptyState error={null} pendingInvites={0} allInConversation={false} onRetry={noop} />
    );
    expect(screen.getByText('Geen contacten beschikbaar')).toBeInTheDocument();
  });
});
