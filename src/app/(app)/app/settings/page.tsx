import type { Metadata } from "next";

import { Card, Container, Heading } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { getUserProfile } from "@/lib/profile";

import { PageHeader } from "../_components/page-header";
import { AccountSecuritySection } from "./_components/account-security-section";
import { PreferencesForm } from "./_components/preferences-form";
import { PrivacyDataSection } from "./_components/privacy-data-section";
import { ProfileSettingsForm } from "./_components/profile-settings-form";
import { SettingsNav } from "./_components/settings-nav";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "account-security", label: "Account & Security" },
  { id: "preferences", label: "Preferences" },
  { id: "privacy-data", label: "Privacy & Data" },
] as const;

/**
 * `/app/settings` - exactly the four sections the Settings prompt asks
 * for (Profile, Account & Security, Preferences, Privacy & Data), no
 * Billing/Subscription (planner discovery/purchasing stays at
 * `/app/store`; billing itself remains unbuilt everywhere - see
 * `commerce-provisioning.ts`'s own comment). Cards, not tabs - this
 * design system has no tabs primitive, and a vertical stack of `Card`
 * sections was already this page's own reviewed pattern; introducing
 * tabs now would be exactly the "unnecessary complexity" both this
 * prompt and Phase 1 §8's original one warn against.
 *
 * Desktop gets `SettingsNav`'s sticky anchor rail alongside the same
 * section stack every viewport renders (Settings §12); below `lg`, the
 * rail disappears and the sections alone are the mobile experience
 * (Settings §15's "stacked section layout" option) - never a second,
 * separately-maintained mobile-only component tree.
 *
 * Every section here is real: Profile persists first/last name, phone,
 * and an avatar (`ProfileSettingsForm`); Account & Security changes the
 * real Supabase Auth password and signs out through the real session
 * (`AccountSecuritySection`); Preferences persists date/time format
 * immediately per change (`PreferencesForm`) - Language has exactly one
 * real, working option rather than an invented list, and there is no
 * Appearance control at all (see `PreferencesForm`'s own comment on the
 * locked light-mode-only design system); Privacy & Data states what's
 * actually stored and routes "export"/"account data management" to
 * their honest states (`PrivacyDataSection`).
 */
export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getUserProfile();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Settings" description="Manage your profile, security, and preferences." />

      <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:items-start">
        <SettingsNav sections={SECTIONS} />

        <div className="flex min-w-0 flex-col gap-6">
          <section id="profile" className="scroll-mt-24">
            <Card variant="standard" padding="lg">
              <Heading as="h2" size="h4" className="mb-4">
                Profile
              </Heading>
              <ProfileSettingsForm
                avatarUrl={profile?.avatarUrl ?? null}
                displayName={profile?.displayName ?? null}
                firstName={profile?.firstName ?? null}
                lastName={profile?.lastName ?? null}
                phone={profile?.phone ?? null}
                email={user.email}
              />
            </Card>
          </section>

          <section id="account-security" className="scroll-mt-24">
            <Card variant="standard" padding="lg">
              <Heading as="h2" size="h4" className="mb-4">
                Account &amp; Security
              </Heading>
              <AccountSecuritySection />
            </Card>
          </section>

          <section id="preferences" className="scroll-mt-24">
            <Card variant="standard" padding="lg">
              <Heading as="h2" size="h4" className="mb-4">
                Preferences
              </Heading>
              <PreferencesForm
                dateFormat={profile?.dateFormat ?? "MM/DD/YYYY"}
                timeFormat={profile?.timeFormat ?? "12h"}
              />
            </Card>
          </section>

          <section id="privacy-data" className="scroll-mt-24">
            <Card variant="standard" padding="lg">
              <Heading as="h2" size="h4" className="mb-4">
                Privacy &amp; Data
              </Heading>
              <PrivacyDataSection />
            </Card>
          </section>
        </div>
      </div>
    </Container>
  );
}
