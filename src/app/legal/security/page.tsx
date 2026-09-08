export const metadata = {
  title: "Security & Data Protection | Alayn AI",
  description: "Alayn AI's security principles and data protection measures.",
};

export default function SecurityPolicyPage() {
  return (
    <article className="space-y-8 text-zinc-600 leading-relaxed text-sm md:text-base">
      <header className="mb-12 border-b border-zinc-100 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
          Security & Data Protection
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
          At Alayn AI, security is fundamental to the way we design, build and
          operate our platform.
        </p>
        <p>
          Alayn is designed to help businesses manage critical operational
          information across areas such as sales, orders, inventory, workforce,
          customers and business intelligence. We therefore take the protection,
          confidentiality, integrity and availability of information seriously.
        </p>
        <p>
          This Security & Data Protection Policy explains the security principles
          and measures that Alayn applies to its Services.
        </p>
        <p>
          This Policy should be read together with our Privacy Policy and Terms of
          Service.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          1. ABOUT ALAYN
        </h2>
        <p>Alayn AI is operated in India by:</p>
        <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100 space-y-2 text-sm">
          <p>
            <strong className="font-semibold text-zinc-900">Trade Name:</strong>{" "}
            BRAHM GLOBAL HOLDINGS
          </p>
          <p>
            <strong className="font-semibold text-zinc-900">Legal Name:</strong>{" "}
            IYAAN KHAN TAUQUIR KHAN
          </p>
          <p>
            <strong className="font-semibold text-zinc-900">Constitution:</strong>{" "}
            Sole Proprietorship
          </p>
          <p>
            <strong className="font-semibold text-zinc-900">
              Principal Place of Business:
            </strong>
            <br />
            Shop No. 6, Veena Beena Shopping Centre,
            <br />
            Guru Nanak Marg, Bandra West,
            <br />
            Mumbai, Maharashtra 400050, India
          </p>
          <p className="pt-2">
            <strong className="font-semibold text-zinc-900">General Support:</strong>{" "}
            <a href="mailto:info@alaynai.com" className="text-red-600 hover:text-red-700">info@alaynai.com</a>
          </p>
          <p>
            <strong className="font-semibold text-zinc-900">Privacy & Data Protection:</strong>{" "}
            <a href="mailto:brahmglobalholdings@gmail.com" className="text-red-600 hover:text-red-700">brahmglobalholdings@gmail.com</a>
          </p>
        </div>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          2. OUR SECURITY PRINCIPLES
        </h2>
        <p>Alayn's security approach is built around four core principles:</p>

        <h3 className="font-semibold text-zinc-900 pt-4">Confidentiality</h3>
        <p>
          Information should only be accessible to authorised individuals, systems
          and service providers.
        </p>

        <h3 className="font-semibold text-zinc-900 pt-4">Integrity</h3>
        <p>
          Information should be protected against unauthorised alteration,
          corruption or misuse.
        </p>

        <h3 className="font-semibold text-zinc-900 pt-4">Availability</h3>
        <p>
          The Alayn platform is designed to remain accessible and operational for
          authorised customers, subject to maintenance, technical limitations and
          events outside our reasonable control.
        </p>

        <h3 className="font-semibold text-zinc-900 pt-4">Accountability</h3>
        <p>
          Security responsibilities should be clearly defined, monitored and
          continuously improved.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          3. PROTECTING CUSTOMER DATA
        </h2>
        <p>Customers retain ownership and control of their underlying business data.</p>
        <p>
          Alayn processes Customer Data only to the extent reasonably necessary
          to:
        </p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>provide the Services;</li>
          <li>operate and maintain customer accounts;</li>
          <li>provide support;</li>
          <li>maintain security;</li>
          <li>detect and prevent misuse;</li>
          <li>troubleshoot technical issues;</li>
          <li>improve service performance;</li>
          <li>comply with legal obligations; and</li>
          <li>perform other functions authorised under the applicable agreement.</li>
        </ul>
        <p className="pt-2">Alayn does not sell Customer Data as a commercial product.</p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          4. ACCESS CONTROL
        </h2>
        <p>
          Alayn uses access-control principles designed to limit access to
          information and systems to authorised personnel and services.
        </p>
        <p>Depending on the relevant system and functionality, measures may include:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>user authentication;</li>
          <li>role-based access controls;</li>
          <li>permission management;</li>
          <li>restricted administrative access;</li>
          <li>credential management;</li>
          <li>access logging;</li>
          <li>authentication controls; and</li>
          <li>periodic review of access where appropriate.</li>
        </ul>
        <p className="pt-2">
          Access to Customer Data is intended to be limited to personnel and
          systems that require such access for legitimate business or service
          purposes.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          5. DATA TRANSMISSION AND ENCRYPTION
        </h2>
        <p>
          Where appropriate, Alayn uses encryption and secure communication
          protocols to help protect information while it is transmitted between
          users, applications and our Services.
        </p>
        <p>
          Security controls may include encryption in transit and other appropriate
          technical safeguards depending on the nature of the information and
          system involved.
        </p>
        <p>
          Where encryption at rest is implemented for particular systems or data
          stores, it may be used to provide an additional layer of protection
          against unauthorised access.
        </p>
        <p>
          Specific encryption technologies may change as our infrastructure
          develops.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          6. INFRASTRUCTURE SECURITY
        </h2>
        <p>
          Alayn uses third-party infrastructure and technology services where
          appropriate to operate its platform.
        </p>
        <p>
          We seek to select service providers that maintain appropriate technical
          and organisational security measures relevant to the services they
          provide.
        </p>
        <p>Infrastructure may include controls relating to:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>network security;</li>
          <li>system access;</li>
          <li>authentication;</li>
          <li>monitoring;</li>
          <li>backups;</li>
          <li>vulnerability management;</li>
          <li>infrastructure resilience;</li>
          <li>physical security; and</li>
          <li>incident response.</li>
        </ul>
        <p className="pt-2">
          Because our infrastructure and technology stack may evolve, specific
          infrastructure providers and technologies are not permanently defined
          by this Policy.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          7. APPLICATION SECURITY
        </h2>
        <p>
          Security considerations are incorporated into the development and
          maintenance of the Alayn platform.
        </p>
        <p>Depending on the relevant system, our security practices may include:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>secure authentication;</li>
          <li>access controls;</li>
          <li>input validation;</li>
          <li>protection against common application vulnerabilities;</li>
          <li>logging and monitoring;</li>
          <li>dependency management;</li>
          <li>vulnerability identification;</li>
          <li>security testing;</li>
          <li>controlled software deployments; and</li>
          <li>ongoing maintenance.</li>
        </ul>
        <p className="pt-2">
          Security practices may evolve as the platform develops and new risks
          are identified.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          8. MONITORING AND LOGGING
        </h2>
        <p>Alayn may maintain technical logs and monitoring information to help:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>detect suspicious activity;</li>
          <li>investigate security incidents;</li>
          <li>maintain system reliability;</li>
          <li>troubleshoot problems;</li>
          <li>protect accounts;</li>
          <li>identify misuse; and</li>
          <li>improve the security of our Services.</li>
        </ul>
        <p className="pt-2">Security and technical logs may include information such as:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>login events;</li>
          <li>authentication attempts;</li>
          <li>IP addresses;</li>
          <li>device information;</li>
          <li>system events;</li>
          <li>application errors; and</li>
          <li>other technical information relevant to security and operations.</li>
        </ul>
        <p className="pt-2">
          Such information is handled in accordance with our Privacy Policy and
          applicable law.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          9. BACKUPS AND RECOVERY
        </h2>
        <p>
          Where appropriate, Alayn may maintain backups of information and
          systems to support service continuity and recovery.
        </p>
        <p>Backup and recovery procedures may be used to help protect against:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>accidental deletion;</li>
          <li>infrastructure failures;</li>
          <li>system failures;</li>
          <li>data corruption;</li>
          <li>security incidents; and</li>
          <li>other operational disruptions.</li>
        </ul>
        <p className="pt-2">
          Backup practices may vary depending on the type of information and
          service involved.
        </p>
        <p>
          Backups are not intended to replace the Customer's own responsibility
          to maintain appropriate copies of critical business information where
          necessary.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          10. DATA RETENTION AND DELETION
        </h2>
        <p>
          Alayn retains information only for as long as reasonably necessary for
          legitimate business, contractual, security or legal purposes.
        </p>
        <p>When Customer Data is no longer required, it may be:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>deleted;</li>
          <li>anonymised;</li>
          <li>de-identified; or</li>
          <li>securely disposed of,</li>
        </ul>
        <p className="pt-2">
          subject to applicable legal, contractual and operational requirements.
        </p>
        <p>
          Following account cancellation or termination, Customer Data may remain
          temporarily available to facilitate account closure, data export,
          dispute resolution or legal compliance.
        </p>
        <p>
          Further information is provided in our Privacy Policy and Refund &
          Cancellation Policy.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          11. DATA PROTECTION
        </h2>
        <p>Alayn is committed to handling personal data responsibly.</p>
        <p>
          Our processing of personal data is governed by our Privacy Policy and
          applicable data protection laws.
        </p>
        <p>
          Where Alayn processes personal data on behalf of a Customer, the Customer
          may determine the purposes for which that information is processed,
          while Alayn may act as a Data Processor or equivalent service provider
          depending on the circumstances.
        </p>
        <p>
          Customers remain responsible for ensuring that they have appropriate
          rights, notices, permissions and lawful grounds to process personal data
          through Alayn.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          12. AI AND DATA PROTECTION
        </h2>
        <p>Alayn incorporates artificial intelligence into certain features of its Services.</p>
        <p>
          AI may process relevant Customer Data where necessary to provide
          functionality requested by the Customer, including:
        </p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>business intelligence;</li>
          <li>forecasting;</li>
          <li>operational recommendations;</li>
          <li>inventory insights;</li>
          <li>workforce insights;</li>
          <li>waste analysis;</li>
          <li>reporting; and</li>
          <li>automation.</li>
        </ul>
        <p className="pt-2">
          Customer Data is not used to train general-purpose AI models without
          appropriate authorisation or consent where required.
        </p>
        <p>
          Alayn may use aggregated, anonymised or de-identified information for
          purposes such as service improvement, analytics, research and product
          development, subject to applicable law.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          13. EMPLOYEE AND CUSTOMER INFORMATION
        </h2>
        <p>
          Alayn may process information relating to employees, customers,
          suppliers and other individuals when such information is entered into
          the platform by a Customer.
        </p>
        <p>Customers are responsible for:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>determining appropriate access permissions;</li>
          <li>limiting access to authorised personnel;</li>
          <li>maintaining appropriate privacy notices;</li>
          <li>obtaining required permissions or consent;</li>
          <li>complying with applicable employment and privacy laws; and</li>
          <li>ensuring that the information entered into Alayn is lawfully processed.</li>
        </ul>
        <p className="pt-2">
          Alayn provides the technology; the Customer remains responsible for how
          it chooses to use that technology.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          14. THIRD-PARTY SERVICE PROVIDERS
        </h2>
        <p>Alayn may use third-party providers for services such as:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>cloud infrastructure;</li>
          <li>databases;</li>
          <li>authentication;</li>
          <li>payment processing;</li>
          <li>communications;</li>
          <li>analytics;</li>
          <li>security;</li>
          <li>monitoring;</li>
          <li>customer support; and</li>
          <li>other technical functions.</li>
        </ul>
        <p className="pt-2">
          Third-party providers may process information on Alayn's behalf where
          necessary to provide the Services.
        </p>
        <p>
          Alayn seeks to use appropriate contractual and technical safeguards when
          engaging relevant service providers.
        </p>
        <p>
          Third-party services remain subject to their own applicable terms and
          privacy policies.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          15. INTERNATIONAL PROCESSING
        </h2>
        <p>
          Depending on the infrastructure and service providers used, information
          may be processed or stored outside India.
        </p>
        <p>
          Where international processing occurs, Alayn will take appropriate
          measures required by applicable law.
        </p>
        <p>
          Our infrastructure and service-provider arrangements may evolve as
          Alayn expands into additional markets.
        </p>
        <p>
          Where legally required, we will provide additional information
          concerning relevant international transfers.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          16. SECURITY INCIDENTS
        </h2>
        <p>
          Alayn maintains procedures designed to identify, assess and respond to
          suspected security incidents.
        </p>
        <p>Where a security incident occurs, our response may include:</p>
        <ol className="list-decimal pl-6 space-y-2 marker:text-zinc-400">
          <li>identifying and containing the incident;</li>
          <li>assessing the nature and potential impact;</li>
          <li>taking steps to protect affected systems and information;</li>
          <li>investigating the cause;</li>
          <li>implementing appropriate remediation;</li>
          <li>documenting relevant actions; and</li>
          <li>providing notifications where required by applicable law or contractual obligations.</li>
        </ol>
        <p className="pt-2">
          Where Alayn processes Customer Data on behalf of a Customer, we may
          notify the relevant Customer where appropriate so that the Customer can
          fulfil its own legal and contractual responsibilities.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          17. VULNERABILITY MANAGEMENT
        </h2>
        <p>Alayn seeks to identify and address security vulnerabilities affecting its Services.</p>
        <p>Depending on the circumstances, this may include:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>security updates;</li>
          <li>software patching;</li>
          <li>dependency updates;</li>
          <li>configuration changes;</li>
          <li>vulnerability assessment;</li>
          <li>security testing; and</li>
          <li>other remediation measures.</li>
        </ul>
        <p className="pt-2">
          The timing and priority of remediation may depend on the severity and
          nature of the identified vulnerability.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          18. EMPLOYEE AND INTERNAL SECURITY
        </h2>
        <p>
          Alayn seeks to ensure that personnel with access to systems or Customer
          Data understand their security responsibilities.
        </p>
        <p>Depending on their role, personnel may be subject to:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>confidentiality obligations;</li>
          <li>access restrictions;</li>
          <li>security procedures;</li>
          <li>account-management controls; and</li>
          <li>other internal security requirements.</li>
        </ul>
        <p className="pt-2">Access to information is limited according to legitimate business requirements.</p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          19. CUSTOMER SECURITY RESPONSIBILITIES
        </h2>
        <p>Security is a shared responsibility.</p>
        <p>Customers are responsible for:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>maintaining secure passwords;</li>
          <li>protecting account credentials;</li>
          <li>enabling available security controls;</li>
          <li>managing user permissions appropriately;</li>
          <li>removing former users promptly;</li>
          <li>restricting administrative access;</li>
          <li>ensuring authorised use of integrations;</li>
          <li>keeping devices and browsers reasonably secure;</li>
          <li>monitoring appropriate account activity; and</li>
          <li>notifying Alayn promptly of suspected unauthorised access.</li>
        </ul>
        <p className="pt-2">
          Alayn cannot protect an account where credentials are intentionally
          shared, compromised through Customer-controlled systems or otherwise
          misused outside Alayn's reasonable control.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          20. SECURITY REPORTING
        </h2>
        <p>
          If you believe you have identified a security vulnerability or security
          incident affecting Alayn, please contact us promptly.
        </p>
        <p>
          <strong className="font-semibold text-zinc-900">Security & Privacy Contact:</strong>{" "}
          <a href="mailto:brahmglobalholdings@gmail.com" className="text-red-600 hover:text-red-700">brahmglobalholdings@gmail.com</a>
        </p>
        <p className="pt-2">
          Please provide as much relevant information as reasonably possible,
          including:
        </p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>a description of the issue;</li>
          <li>affected service or functionality;</li>
          <li>steps required to reproduce the issue, where applicable;</li>
          <li>relevant screenshots or technical information; and</li>
          <li>your contact details.</li>
        </ul>
        <p className="pt-2">
          Please do not publicly disclose a suspected vulnerability before
          allowing Alayn a reasonable opportunity to investigate and respond.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          21. SECURITY DISCLOSURES AND CERTIFICATIONS
        </h2>
        <p>Alayn is committed to continuously developing its security programme.</p>
        <p>
          We will not claim that Alayn holds a particular security certification,
          accreditation or compliance status unless that certification or status
          has actually been obtained and remains current.
        </p>
        <p>
          Information concerning specific certifications, audits or security
          assessments may be made available to eligible enterprise customers
          where appropriate.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          22. SERVICE AVAILABILITY
        </h2>
        <p>Alayn aims to provide reliable and resilient Services.</p>
        <p>However, no internet-based platform can guarantee uninterrupted availability.</p>
        <p>Availability may be affected by:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>planned maintenance;</li>
          <li>emergency maintenance;</li>
          <li>infrastructure failures;</li>
          <li>telecommunications;</li>
          <li>internet connectivity;</li>
          <li>third-party services;</li>
          <li>security incidents;</li>
          <li>events beyond our reasonable control; or</li>
          <li>other technical circumstances.</li>
        </ul>
        <p className="pt-2">
          Specific uptime commitments, response times or service levels may be
          provided under a separate Service Level Agreement (SLA) for eligible
          enterprise customers.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          23. RESPONSIBLE SECURITY PRACTICE
        </h2>
        <p>Alayn's security programme is designed to evolve with the platform.</p>
        <p>As Alayn grows, we may introduce additional measures including:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>enhanced authentication;</li>
          <li>expanded monitoring;</li>
          <li>security assessments;</li>
          <li>penetration testing;</li>
          <li>additional encryption controls;</li>
          <li>formal security frameworks;</li>
          <li>independent audits; and</li>
          <li>additional enterprise security controls.</li>
        </ul>
        <p className="pt-2">
          Where such measures are implemented and materially relevant to
          customers, we may update this Policy or provide additional
          documentation.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          24. NO ABSOLUTE SECURITY GUARANTEE
        </h2>
        <p>
          While Alayn takes reasonable technical and organisational measures to
          protect information, no digital system can be guaranteed to be
          completely secure.
        </p>
        <p>Accordingly, Alayn cannot guarantee that:</p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>unauthorised access will never occur;</li>
          <li>every security vulnerability will always be identified immediately;</li>
          <li>every third-party service will remain secure;</li>
          <li>data will never be lost or compromised; or</li>
          <li>the Services will never experience a security incident.</li>
        </ul>
        <p className="pt-2">
          Alayn will nevertheless take appropriate steps to prevent, identify,
          contain and respond to security incidents.
        </p>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          25. CHANGES TO THIS POLICY
        </h2>
        <p>
          We may update this Security & Data Protection Policy from time to time
          to reflect:
        </p>
        <ul className="grid sm:grid-cols-2 gap-2 list-disc pl-6 marker:text-zinc-400">
          <li>changes to our technology;</li>
          <li>improvements to security practices;</li>
          <li>new Services;</li>
          <li>changes to our infrastructure;</li>
          <li>legal or regulatory developments; or</li>
          <li>changes in industry security practices.</li>
        </ul>
        <p className="pt-2">
          The latest version will always display the applicable Last Updated date.
        </p>
        <p>
          Material changes may be communicated through the Alayn website, platform,
          email or other appropriate channels.
        </p>
      </section>

      <section className="space-y-4 pt-8 pb-12">
        <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-100 pb-2">
          26. CONTACT US
        </h2>
        <p>For security, privacy or data protection enquiries:</p>
        
        <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100 mt-4 space-y-4">
          <div>
            <strong className="block text-zinc-900">BRAHM GLOBAL HOLDINGS</strong>
            <span className="text-sm">A sole proprietorship owned and operated by Iyaan Khan Tauquir Khan</span>
          </div>
          
          <div className="text-sm space-y-1">
            <strong className="block text-zinc-900">Principal Place of Business</strong>
            <p>Shop No. 6, Veena Beena Shopping Centre<br/>
            Guru Nanak Marg, Bandra West<br/>
            Mumbai, Maharashtra 400050<br/>
            India</p>
          </div>

          <div className="text-sm space-y-2 pt-2 border-t border-zinc-200">
            <p>
              <strong className="font-semibold text-zinc-900">General Support:</strong>{" "}
              <a href="mailto:info@alaynai.com" className="text-red-600 hover:text-red-700">info@alaynai.com</a>
            </p>
            <p>
              <strong className="font-semibold text-zinc-900">Security & Privacy:</strong>{" "}
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
        <p className="mt-1">ALAYN AI — The AI Operating System for Modern Business.</p>
      </footer>
    </article>
  );
}
