export const metadata = {
  title: "Support, Escalation & Grievance | Alayn AI",
  description: "Alayn AI's customer support framework, escalation procedures, and formal grievance process.",
};

export default function SupportPolicyPage() {
  return (
    <article className="space-y-8 text-zinc-600 leading-relaxed text-sm md:text-base">
      <header className="mb-12 border-b border-zinc-100 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
          Support, Escalation & Grievance
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-zinc-500">
          <p>
            <strong className="font-semibold text-zinc-700">Effective Date:</strong>{" "}
            14 August 2026
          </p>
          <p>
            <strong className="font-semibold text-zinc-700">Last Updated:</strong>{" "}
            14 August 2026
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <p>
          At Alayn AI, we believe exceptional software should be supported by
          exceptional service.
        </p>
        <p>
          Our support framework is designed to provide customers with a clear,
          professional route for obtaining assistance, reporting issues,
          escalating unresolved matters and raising formal grievances.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          1. CUSTOMER SUPPORT
        </h2>
        <p>For general assistance with Alayn, please contact:</p>
        <p>
          <strong className="font-semibold text-zinc-900">Email:</strong>{" "}
          <a href="mailto:info@alaynai.com" className="text-red-600 hover:text-red-700">info@alaynai.com</a>
        </p>
        <p className="pt-2">Our support team can assist with matters including:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>Account and access issues</li>
          <li>POS and KDS functionality</li>
          <li>Inventory and workforce management</li>
          <li>Platform features and configuration</li>
          <li>Technical issues</li>
          <li>Integrations</li>
          <li>Billing and subscriptions</li>
          <li>Product guidance</li>
          <li>Feature requests</li>
        </ul>
        <p className="pt-2">
          When contacting us, please provide sufficient information for us to
          identify your account and understand the matter.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          2. TECHNICAL SUPPORT
        </h2>
        <p>For technical issues, we recommend including:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>Business name</li>
          <li>Registered Alayn account email</li>
          <li>Relevant outlet or location</li>
          <li>Description of the issue</li>
          <li>Date and approximate time the issue occurred</li>
          <li>Device, browser or system being used</li>
          <li>Screenshots, recordings or other relevant information, where available</li>
        </ul>
        <p className="pt-2">
          This information helps our team investigate and resolve issues
          efficiently.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          3. BILLING & SUBSCRIPTION SUPPORT
        </h2>
        <p>
          For enquiries relating to subscriptions, invoices, payments, renewals or
          cancellations:
        </p>
        <p>
          <strong className="font-semibold text-zinc-900">Billing Support:</strong>{" "}
          <a href="mailto:info@alaynai.com" className="text-red-600 hover:text-red-700">info@alaynai.com</a>
        </p>
        <p className="pt-2">
          Please include your invoice number, transaction reference or registered
          account email where available.
        </p>
        <p>
          Refunds and cancellations are handled in accordance with our Refund &
          Cancellation Policy and any applicable customer agreement.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          4. PRIVACY & DATA PROTECTION
        </h2>
        <p>
          For enquiries concerning personal information, Customer Data or data
          protection:
        </p>
        <p>
          <strong className="font-semibold text-zinc-900">Privacy Contact:</strong>{" "}
          <a href="mailto:brahmglobalholdings@gmail.com" className="text-red-600 hover:text-red-700">brahmglobalholdings@gmail.com</a>
        </p>
        <p className="pt-2">This includes matters relating to:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>Personal data</li>
          <li>Data access</li>
          <li>Data correction</li>
          <li>Data deletion</li>
          <li>Privacy concerns</li>
          <li>Data security</li>
          <li>Unauthorised access</li>
          <li>Data protection requests</li>
        </ul>
        <p className="pt-2">
          Our processing of personal information is governed by our Privacy Policy
          and Security & Data Protection Policy.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          5. ESCALATION PROCESS
        </h2>
        <p>We aim to resolve customer matters at the earliest reasonable opportunity.</p>
        <p>
          If you believe an issue has not been adequately resolved through
          standard support, you may request an escalation.
        </p>

        <div className="space-y-6 pt-4">
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5">
            <h3 className="font-semibold text-zinc-900 mb-2">Stage 1 — Support</h3>
            <p>
              Contact <a href="mailto:info@alaynai.com" className="text-red-600 hover:text-red-700">info@alaynai.com</a>{" "}
              and provide the relevant details.
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5">
            <h3 className="font-semibold text-zinc-900 mb-2">Stage 2 — Escalation</h3>
            <p>
              If the matter remains unresolved, reply to the existing support
              correspondence and clearly state that you would like the matter
              escalated for management review.
            </p>
            <p className="pt-2">
              The matter will be reviewed by an appropriate senior member of the
              Alayn team.
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5">
            <h3 className="font-semibold text-zinc-900 mb-2">Stage 3 — Formal Grievance</h3>
            <p>
              If you remain dissatisfied following the escalation review, you may
              submit a formal grievance using the contact details below.
            </p>
            <p className="pt-2">
              We will review the matter and provide a written response where
              appropriate.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          6. GRIEVANCE OFFICER
        </h2>
        <p>
          For formal grievances concerning Alayn's Services, privacy, data
          protection or customer rights, you may contact:
        </p>
        <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100 text-sm">
          <p>
            <strong className="block text-zinc-900 mb-1">Grievance Officer</strong>
            Iyaan Khan Tauquir Khan
          </p>
          <p className="mt-4">
            <strong className="block text-zinc-900 mb-1">Email:</strong>
            <a href="mailto:brahmglobalholdings@gmail.com" className="text-red-600 hover:text-red-700">brahmglobalholdings@gmail.com</a>
          </p>
          <p className="mt-4">
            <strong className="block text-zinc-900 mb-1">Business:</strong>
            BRAHM GLOBAL HOLDINGS
          </p>
        </div>
        <p>
          The Grievance Officer will review complaints falling within the
          applicable legal and regulatory framework and coordinate an appropriate
          response.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          7. RESPONSE TIMES
        </h2>
        <p>
          We aim to acknowledge and address enquiries as promptly as reasonably
          practicable.
        </p>
        <p>Response times may vary depending on:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>The complexity of the matter</li>
          <li>The information provided</li>
          <li>Whether investigation by a third party is required</li>
          <li>The severity of a technical issue</li>
          <li>The nature of the grievance</li>
          <li>Applicable legal or regulatory requirements</li>
        </ul>
        <p className="pt-2">
          Where a matter requires additional investigation, we may provide an
          update regarding its progress.
        </p>
        <p>
          For urgent security or data-protection matters, please clearly identify
          the matter as <strong>URGENT — SECURITY / DATA PROTECTION</strong> in
          your email subject line.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          8. SECURITY INCIDENTS
        </h2>
        <p>
          If you believe that an Alayn account or Customer Data has been
          compromised, please notify us immediately at:{" "}
          <a href="mailto:brahmglobalholdings@gmail.com" className="text-red-600 hover:text-red-700">brahmglobalholdings@gmail.com</a>
        </p>
        <p>Please provide as much relevant information as possible.</p>
        <p>
          We may request additional information to verify the account, assess the
          incident and take appropriate protective measures.
        </p>
        <p>
          Our handling of security incidents is further described in our Security
          & Data Protection Policy.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          9. FAIR AND PROFESSIONAL RESOLUTION
        </h2>
        <p>
          We are committed to handling customer concerns fairly, respectfully and
          professionally.
        </p>
        <p>Where appropriate, we will:</p>
        <ul className="list-disc pl-6 space-y-2 marker:text-zinc-400">
          <li>review the information provided;</li>
          <li>investigate the relevant circumstances;</li>
          <li>consider applicable contractual terms and policies;</li>
          <li>communicate the outcome clearly; and</li>
          <li>take reasonable corrective action where appropriate.</li>
        </ul>
        <p className="pt-2">
          Nothing in this process limits any rights or remedies available to you
          under applicable law.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          10. CUSTOMER RESPONSIBILITIES
        </h2>
        <p>
          Customers are expected to provide accurate information and cooperate
          reasonably with support and investigation processes.
        </p>
        <p>Customers should not:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>knowingly provide false information;</li>
          <li>impersonate another person;</li>
          <li>attempt to circumvent security procedures;</li>
          <li>submit malicious files or content;</li>
          <li>abuse support channels; or</li>
          <li>use support channels for unlawful purposes.</li>
        </ul>
        <p className="pt-2">
          Where necessary to protect our personnel, systems or customers, Alayn
          may restrict abusive or malicious use of support channels.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          11. ENTERPRISE CUSTOMERS
        </h2>
        <p>
          Enterprise customers may have dedicated support arrangements, escalation
          procedures or service-level commitments under a separate written
          agreement.
        </p>
        <p>
          Where such an agreement applies, its specific support and escalation
          provisions will take precedence to the extent of any inconsistency with
          this page.
        </p>
      </section>

      <section className="space-y-4 pt-8 pb-12">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          12. CONTACT DETAILS
        </h2>
        <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100 mt-4 space-y-4">
          <div>
            <strong className="block text-zinc-900">BRAHM GLOBAL HOLDINGS</strong>
            <span className="text-sm">A sole proprietorship owned and operated by Iyaan Khan Tauquir Khan</span>
          </div>
          
          <div className="text-sm space-y-1">
            <strong className="block text-zinc-900">Principal Place of Business</strong>
            <p>Shop No. 6, Veena Beena Shopping Centre<br/>
            Guru Nanak Marg<br/>
            Bandra West<br/>
            Mumbai, Maharashtra 400050<br/>
            India</p>
          </div>

          <div className="text-sm space-y-2 pt-2 border-t border-zinc-200">
            <p>
              <strong className="font-semibold text-zinc-900">General Support:</strong>{" "}
              <a href="mailto:info@alaynai.com" className="text-red-600 hover:text-red-700">info@alaynai.com</a>
            </p>
            <p>
              <strong className="font-semibold text-zinc-900">Privacy, Security & Grievances:</strong>{" "}
              <a href="mailto:brahmglobalholdings@gmail.com" className="text-red-600 hover:text-red-700">brahmglobalholdings@gmail.com</a>
            </p>
            <p>
              <strong className="font-semibold text-zinc-900">GSTIN:</strong> 27KOBPK2043Q1ZH
            </p>
          </div>
        </div>
      </section>
      
      <footer className="text-xs text-zinc-400 pt-8 border-t border-zinc-100 text-center">
        <p>© 2026 Alayn. All rights reserved.</p>
        <p className="mt-1">ALAYN AI</p>
        <p>The AI Operating System for Modern Business.</p>
      </footer>
    </article>
  );
}
