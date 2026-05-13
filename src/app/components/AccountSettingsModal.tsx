import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Receipt, User as UserIcon, Crown, ExternalLink, Loader2 } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectSubscription, selectSubscriptionLoading } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { BaseModal } from './BaseModal';
import { PlanCard } from './PlanCard';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { api } from '../api';
import { logger } from '../logger';
import { PLAN_DISPLAY } from '../../../shared/schemas/subscription';
import { resolvePlan, getPlanFeatures, formatSubscriptionStatus, formatPeriodEndLabel } from '../domain/billing';

const log = logger.create('AccountSettings');

type SettingsTab = 'account' | 'plan' | 'invoices';

const TAB_CONFIG: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'account', label: 'Account', icon: <UserIcon size={ICON_SIZE.sm} /> },
  { id: 'plan', label: 'Plan', icon: <Crown size={ICON_SIZE.sm} /> },
  { id: 'invoices', label: 'Invoices', icon: <Receipt size={ICON_SIZE.sm} /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

const FORMAT_CURRENCY = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

const FORMAT_DATE = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const FORMAT_LONG_DATE = (isoString: string) =>
  new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export function AccountSettingsModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const subscription = useStore(selectSubscription);
  const subscriptionLoading = useStore(selectSubscriptionLoading);
  const loadSubscription = useStore(s => s.loadSubscription);
  const startCheckout = useStore(s => s.startCheckout);
  const openBillingPortal = useStore(s => s.openBillingPortal);

  const currentPlan = resolvePlan(subscription);

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      log.debug('open', 'Account settings opened');
      loadSubscription();
    }
  }, [isOpen, loadSubscription]);

  useEffect(() => {
    if (isOpen && activeTab === 'invoices') {
      loadInvoices();
    }
  }, [isOpen, activeTab]);

  const loadInvoices = useCallback(async () => {
    log.info('loadInvoices', 'Fetching invoices');
    setInvoicesLoading(true);
    try {
      const data = await api.getInvoices();
      setInvoices(data);
      log.info('loadInvoices', 'Invoices loaded', { count: data.length });
    } catch (err) {
      log.error('loadInvoices', 'Failed to load invoices', { error: err instanceof Error ? err.message : 'Unknown' });
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const handleUpgrade = async () => {
    log.info('handleUpgrade', 'Starting checkout flow');
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } finally {
      setCheckoutLoading(false);
    }
  };

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || null;
  const email = user?.email || '';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Account Settings" size="wide">
      <div className="flex gap-8 min-h-[400px]">
        <nav className="flex flex-col gap-1 w-40 shrink-0 border-r border-border-subtle pr-4">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-standard text-caption transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-surface-frost-05 text-text-primary'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-frost-04'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0 overflow-y-auto">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-caption-lg text-text-primary mb-4">Profile</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-caption text-text-tertiary">Name</span>
                    <span className="text-caption text-text-primary">{fullName || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-caption text-text-tertiary">Email</span>
                    <span className="text-caption text-text-primary">{email}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-caption-lg text-text-primary mb-4">Current Plan</h3>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-standard ${
                    currentPlan === 'plus'
                      ? 'bg-accent-surface text-accent'
                      : 'bg-surface-frost-05 text-text-tertiary'
                  }`}>
                    <Crown size={ICON_SIZE.sm} />
                    <span className="text-caption">{PLAN_DISPLAY[currentPlan].name}</span>
                  </div>
                  <span className="text-label-sm text-text-quaternary">{PLAN_DISPLAY[currentPlan].priceLabel}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-6">
              <h3 className="text-caption-lg text-text-primary mb-4">Subscription</h3>

              {subscriptionLoading ? (
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
                  <span className="text-caption">Loading subscription details...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <PlanCard
                      name={PLAN_DISPLAY.free.name}
                      price={PLAN_DISPLAY.free.priceLabel}
                      description={PLAN_DISPLAY.free.description}
                      features={getPlanFeatures('free')}
                      isCurrent={currentPlan === 'free'}
                    />
                    <PlanCard
                      name={PLAN_DISPLAY.plus.name}
                      price={PLAN_DISPLAY.plus.priceLabel}
                      description={PLAN_DISPLAY.plus.description}
                      features={getPlanFeatures('plus')}
                      isCurrent={currentPlan === 'plus'}
                    />
                  </div>

                  {currentPlan === 'free' && (
                    <button
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                      className="btn-primary flex items-center gap-2"
                    >
                      {checkoutLoading ? (
                        <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
                      ) : (
                        <CreditCard size={ICON_SIZE.sm} />
                      )}
                      <span>{checkoutLoading ? 'Redirecting...' : 'Upgrade to Arvid Plus'}</span>
                    </button>
                  )}

                  {currentPlan === 'plus' && subscription && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-1">
                          <span className="text-caption text-text-tertiary">Status</span>
                          <span className={`text-caption ${
                            subscription.status === 'active' && !subscription.cancelAtPeriodEnd
                              ? 'text-status-success'
                              : 'text-status-warning'
                          }`}>
                            {formatSubscriptionStatus(subscription)}
                          </span>
                        </div>
                        {subscription.currentPeriodEnd && (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-caption text-text-tertiary">
                              {formatPeriodEndLabel(subscription)}
                            </span>
                            <span className="text-caption text-text-primary">
                              {FORMAT_LONG_DATE(subscription.currentPeriodEnd)}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={openBillingPortal}
                        className="btn-ghost flex items-center gap-2"
                      >
                        <ExternalLink size={ICON_SIZE.sm} />
                        <span>Manage subscription</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <h3 className="text-caption-lg text-text-primary mb-4">Invoices</h3>

              {invoicesLoading ? (
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
                  <span className="text-caption">Loading invoices...</span>
                </div>
              ) : invoices.length === 0 ? (
                <p className="text-caption text-text-quaternary">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map(invoice => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between py-3 px-4 rounded-standard border border-border-subtle hover:bg-surface-frost-04 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-caption text-text-primary">
                            {invoice.number ?? invoice.id}
                          </p>
                          <p className="text-label-sm text-text-quaternary">
                            {FORMAT_DATE(invoice.created)}
                          </p>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-caption text-text-primary">
                          {FORMAT_CURRENCY(invoice.amountDue, invoice.currency)}
                        </span>
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-tertiary hover:text-text-primary transition-colors"
                            title="View invoice"
                          >
                            <ExternalLink size={ICON_SIZE.sm} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentPlan === 'plus' && (
                <button
                  onClick={openBillingPortal}
                  className="btn-ghost flex items-center gap-2 mt-4"
                >
                  <ExternalLink size={ICON_SIZE.sm} />
                  <span>View all in Stripe</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
