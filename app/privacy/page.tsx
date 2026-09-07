import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Karya",
  description: "Privacy Policy for Karya Work Management Platform",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="rounded-xl object-contain"
          />
        </Link>
        <div className="flex items-center gap-4 text-sm text-[#a3a3a3]">
          <Link href="/terms" className="hover:text-[#f5f5f5] transition-colors">
            Terms of Service
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-[#6B7A45] text-white rounded-full hover:bg-[#4e5a31] transition-colors text-sm font-medium"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 pb-24">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-[#737373] mb-10">Last updated: February 23, 2026</p>

        <div className="space-y-8 text-[#d4d4d4] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">1. Introduction</h2>
            <p>
              Welcome to <strong>Karya</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). Karya is a work management
              platform that helps teams plan, track, and collaborate on projects. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              application and services available at{" "}
              <a href="https://www.arogyaherb.store" className="text-[#6B7A45] hover:underline">
                arogyaherb.store
              </a>{" "}
              (the &quot;Service&quot;).
            </p>
            <p className="mt-3">
              By using the Service, you agree to the collection and use of information in accordance
              with this policy. If you do not agree with this policy, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-[#e5e5e5] mt-4 mb-2">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Account Information:</strong> When you register, we collect your name, email
                address, and password.
              </li>
              <li>
                <strong>Profile Information:</strong> Any additional details you choose to provide,
                such as profile pictures or display names.
              </li>
              <li>
                <strong>Content:</strong> Tasks, projects, notes, comments, ideas, and any other
                content you create within the Service.
              </li>
              <li>
                <strong>Team Information:</strong> When you create or join a team, we collect
                information related to team membership and invitations.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-[#e5e5e5] mt-4 mb-2">
              2.2 Information from Third-Party Services
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Google Account Data:</strong> If you sign in using Google OAuth, we receive
                your name, email address, and profile picture from your Google account.
              </li>
              <li>
                <strong>Google Calendar Data:</strong> If you connect your Google Calendar, we access
                your calendar to create, update, and delete events related to your tasks and
                deadlines within Karya. We only access calendar data necessary to sync your tasks.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-[#e5e5e5] mt-4 mb-2">
              2.3 Automatically Collected Information
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Usage Data:</strong> We may collect information about how you interact with
                the Service, including pages visited, features used, and timestamps.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system, and device
                identifiers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Provide, operate, and maintain the Service.</li>
              <li>Create and manage your account.</li>
              <li>
                Sync tasks and deadlines with your Google Calendar when you enable this integration.
              </li>
              <li>Facilitate team collaboration, invitations, and project management.</li>
              <li>Send you notifications related to your tasks, projects, and team activity.</li>
              <li>Improve, personalize, and expand the Service.</li>
              <li>Communicate with you about updates, security alerts, and support.</li>
              <li>Detect, prevent, and address technical issues and security threats.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              4. Google API Services – Limited Use Disclosure
            </h2>
            <p>
              Karya&apos;s use and transfer of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7A45] hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="mt-3">Specifically:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>
                We only request access to Google Calendar data that is necessary for the
                functionality of syncing your tasks and deadlines.
              </li>
              <li>
                We do not use Google user data for serving advertisements.
              </li>
              <li>
                We do not transfer Google user data to third parties unless necessary to provide or
                improve the Service, comply with applicable laws, or as part of a merger or
                acquisition (with user consent).
              </li>
              <li>
                We do not use Google user data to develop or improve AI/ML models unrelated to the
                core functionality of the Service.
              </li>
              <li>
                Human access to Google user data is limited to what is necessary for security
                purposes, compliance with law, or at your explicit request.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              5. Data Storage and Security
            </h2>
            <p>
              Your data is stored securely using industry-standard encryption and security practices.
              We use secure database services and encrypt sensitive information such as passwords
              using bcrypt hashing. Access tokens for third-party services (such as Google) are
              stored securely and refreshed automatically.
            </p>
            <p className="mt-3">
              While we strive to use commercially acceptable means of protecting your data, no method
              of transmission over the Internet or electronic storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">6. Data Sharing</h2>
            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>
                <strong>With your team:</strong> Information you add to shared projects, tasks, and
                comments is visible to other members of your team or workspace.
              </li>
              <li>
                <strong>Service Providers:</strong> We may share data with trusted third-party
                providers who assist in operating the Service (e.g., database hosting, email
                delivery via Resend).
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose your information if required to
                do so by law or in response to valid legal requests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              7. Your Rights and Choices
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Access & Update:</strong> You can access and update your account information
                at any time through the Service.
              </li>
              <li>
                <strong>Delete Account:</strong> You may request deletion of your account and
                associated data by contacting us.
              </li>
              <li>
                <strong>Revoke Google Access:</strong> You can disconnect your Google account and
                revoke calendar access at any time through your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6B7A45] hover:underline"
                >
                  Google Account permissions
                </a>
                .
              </li>
              <li>
                <strong>Data Portability:</strong> You may request a copy of your data by contacting
                us.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. These cookies are
              necessary for the Service to function and cannot be disabled. We do not use third-party
              tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p>
              Our Service is not directed to individuals under the age of 13. We do not knowingly
              collect personal information from children under 13. If we become aware that a child
              under 13 has provided us with personal data, we will take steps to delete such
              information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              Continued use of the Service after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your data
              rights, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:support@arogyaherb.store"
                className="text-[#6B7A45] hover:underline"
              >
                support@arogyaherb.store
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="rounded-lg object-contain" />
          </div>
          <p className="text-sm text-[#737373]">© 2026 All rights reserved. Built for modern teams.</p>
          <div className="flex items-center gap-6 text-sm text-[#737373]">
            <Link href="/privacy" className="hover:text-[#f5f5f5] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#f5f5f5] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
