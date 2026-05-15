import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Receipt, User as UserIcon, Crown, ExternalLink, Loader2, Plug } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectSubscription, selectSubscriptionLoading } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { BaseModal } from './BaseModal';
import { ModalSidebar } from './ui/ModalSidebar';
import type { ModalSidebarItem } from './ui/ModalSidebar';
import { ModalFooter } from './ui/ModalFooter';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { SubmitButton } from './ui/SubmitButton';
import { PlanCard } from './PlanCard';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { api } from '../api';
import { logger } from '../logger';
import { PLAN_DISPLAY } from '../../../shared/schemas/subscription';
import { resolvePlan, getPlanFeatures, formatSubscriptionStatus, formatPeriodEndLabel } from '../domain/billing';
import { IntegrationsTab } from './account-settings/IntegrationsTab';

const log = logger.create('AccountSettings');

type SettingsTab = 'account' | 'integrations' | 'plan' | 'invoices';

const TAB_CONFIG: ModalSidebarItem[] = [
  { id: 'account', label: 'Account', icon: <UserIcon size={ICON_SIZE.sm} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={ICON_SIZE.sm} /> },
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
  const { user, updateProfile } = useAuth();
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
  const [nameValue, setNameValue] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const originalName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const email = user?.email || '';
  const isDirty = nameValue !== originalName;

  useEffect(() => {
    if (isOpen) {
      log.debug('open', 'Account settings opened');
      loadSubscription();
      setNameValue(originalName);
      setNameError(null);
    }
  }, [isOpen, loadSubscription, originalName]);

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

  const handleSaveProfile = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    setNameError(null);
    const { error } = await updateProfile({ fullName: trimmed });
    setIsSaving(false);
    if (error) {
      setNameError('Failed to update name.');
    }
  };

  const handleCancel = () => {
    setNameValue(originalName);
    setNameError(null);
  };

  const sidebar = (
    <ModalSidebar
      items={TAB_CONFIG}
      activeId={activeTab}
      onSelect={(id) => setActiveTab(id as SettingsTab)}
    />
  );

  const accountFooter = activeTab === 'account' && isDirty ? (
    <ModalFooter>
      <button onClick={handleCancel} className="btn-ghost">Cancel</button>
      <SubmitButton onClick={handleSaveProfile} label="Save" isLoading={isSaving} />
    </ModalFooter>
  ) : undefined;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Account Settings" size="xl" sidebar={sidebar} footer={accountFooter}>
      <div className="p-6">
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField label="Name" error={nameError}>
                <TextInput
                  value={nameValue}
                  onChange={(v) => { setNameValue(v); setNameError(null); }}
                  placeholder="Your name"
                />
              </FormField>
              <FormField label="Email">
                <TextInput
                  value={email}
                  onChange={() => {}}
                  disabled
                />
              </FormField>
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

        {activeTab === 'integrations' && (
          <IntegrationsTab />
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6">
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
    </BaseModal>
  );
}
