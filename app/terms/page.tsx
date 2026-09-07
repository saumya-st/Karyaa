import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Karya",
  description: "Terms of Service for Karya Work Management Platform",
};

export default function TermsOfService() {
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
          <Link href="/privacy" className="hover:text-[#f5f5f5] transition-colors">
            Privacy Policy
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-[#737373] mb-10">Last updated: February 23, 2026</p>

        <div className="space-y-8 text-[#d4d4d4] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>Karya</strong> (&quot;the Service&quot;), available at{" "}
              <a href="https://www.arogyaherb.store" className="text-[#6B7A45] hover:underline">
                arogyaherb.store
              </a>
              , you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to
              these Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              2. Description of Service
            </h2>
            <p>
              Karya is a work management platform that enables users to create and manage projects,
              track tasks, collaborate with team members, take notes, organize ideas, and optionally
              sync tasks with Google Calendar. The Service is provided &quot;as is&quot; and &quot;as available.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                You must provide accurate and complete information when creating an account.
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your login credentials.
              </li>
              <li>
                You are responsible for all activities that occur under your account.
              </li>
              <li>
                You must notify us immediately of any unauthorized use of your account.
              </li>
              <li>
                You may sign in using email/password or via Google OAuth. When using Google OAuth,
                you authorize us to access the data outlined in our{" "}
                <Link href="/privacy" className="text-[#6B7A45] hover:underline">
                  Privacy Policy
                </Link>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Use the Service for any unlawful or unauthorized purpose.</li>
              <li>
                Attempt to gain unauthorized access to any part of the Service or its related
                systems.
              </li>
              <li>
                Upload, post, or transmit any content that is harmful, offensive, or infringes on
                the rights of others.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the Service.
              </li>
              <li>
                Use automated means (bots, scrapers) to access the Service without our written
                consent.
              </li>
              <li>Impersonate another person or entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">5. User Content</h2>
            <p>
              You retain ownership of all content you create within the Service (tasks, projects,
              notes, comments, ideas, etc.). By using the Service, you grant us a limited license to
              store, process, and display your content solely for the purpose of providing the
              Service to you and your team.
            </p>
            <p className="mt-3">
              We do not claim ownership of your content. You are solely responsible for the content
              you create and share within the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              6. Google Calendar Integration
            </h2>
            <p>
              If you choose to connect your Google Calendar, you authorize Karya to create, update,
              and delete calendar events associated with your tasks and deadlines. This integration
              is optional and can be disconnected at any time.
            </p>
            <p className="mt-3">
              Our use of Google Calendar data complies with the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7A45] hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. See our{" "}
              <Link href="/privacy" className="text-[#6B7A45] hover:underline">
                Privacy Policy
              </Link>{" "}
              for full details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              7. Teams and Collaboration
            </h2>
            <p>
              When you create or join a team, content shared within that team (projects, tasks,
              comments) becomes visible to other team members. You are responsible for ensuring you
              have the right to share any content you post within a team workspace.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              8. Intellectual Property
            </h2>
            <p>
              The Service, including but not limited to its design, logos, code, and features, is
              owned by Karya and protected by intellectual property laws. You may not copy, modify,
              distribute, or reverse-engineer any part of the Service without our prior written
              consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to the Service at
              our sole discretion, without notice, for conduct that we determine violates these Terms
              or is harmful to other users, us, or third parties.
            </p>
            <p className="mt-3">
              You may terminate your account at any time by contacting us. Upon termination, your
              right to use the Service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              10. Disclaimers
            </h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of
              any kind, either express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="mt-3">
              We do not warrant that the Service will be uninterrupted, secure, or error-free, or
              that any defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              11. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Karya and its affiliates shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages, or
              any loss of profits or revenues, whether incurred directly or indirectly, or any loss
              of data, use, goodwill, or other intangible losses, resulting from your access to or
              use of (or inability to access or use) the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">
              12. Changes to These Terms
            </h2>
            <p>
              We may modify these Terms at any time. We will notify you of significant changes by
              posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India,
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3">14. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
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
