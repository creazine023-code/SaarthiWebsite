import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const states = ['Delhi', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];

const services = [
  { id: 'll', eyebrow: 'Most people start here', title: 'New learner licence', copy: 'Apply for your first learner licence in about 15 minutes.', icon: '↗', tone: 'mint', tags: ['New application', 'eKYC or non-eKYC'] },
  { id: 'dl', eyebrow: 'Existing licence', title: 'Driving licence services', copy: 'Renew, replace, or update the address on your licence.', icon: '⌁', tone: 'sand', tags: ['Renewal', 'Duplicate', 'Address change'] },
  { id: 'status', eyebrow: 'Already applied?', title: 'Track application status', copy: 'See the latest update without searching through old receipts.', icon: '◌', tone: 'lilac', tags: ['Application number', 'Date of birth'] },
];

const llSteps = ['Start', 'Your details', 'Vehicle class', 'Documents', 'Test slot'];
const dlSteps = ['Choose service', 'Find your licence', 'Confirm & pay'];
const statusSteps = ['Find application', 'Application timeline'];

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  return { view: params.get('view') || 'dashboard', step: Number(params.get('step') || 1) };
}

function go(view, step = 1) {
  const next = new URLSearchParams();
  if (view !== 'dashboard') next.set('view', view);
  if (view !== 'dashboard' && step > 1) next.set('step', step);
  window.history.pushState({}, '', `${window.location.pathname}${next.toString() ? `?${next}` : ''}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function Icon({ children, label }) {
  return <span className="icon" aria-label={label} role="img">{children}</span>;
}

function App() {
  const [route, setRoute] = useState(readRoute);
  const [selectedState, setSelectedState] = useState(() => localStorage.getItem('licence-lane-state') || 'Delhi');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [scale, setScale] = useState(() => localStorage.getItem('licence-lane-scale') || 'normal');
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem('licence-lane-progress') || '{}'));

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    localStorage.setItem('licence-lane-state', selectedState);
  }, [selectedState]);

  useEffect(() => {
    localStorage.setItem('licence-lane-scale', scale);
    document.documentElement.dataset.scale = scale;
  }, [scale]);

  const updateProgress = (next) => {
    const merged = { ...saved, ...next };
    setSaved(merged);
    localStorage.setItem('licence-lane-progress', JSON.stringify(merged));
  };

  const page = route.view === 'll' ? <LearnerWizard route={route} go={go} onSave={updateProgress} saved={saved} />
    : route.view === 'dl' ? <DrivingServices route={route} go={go} onSave={updateProgress} saved={saved} />
      : route.view === 'status' ? <StatusTracker route={route} go={go} />
        : <Dashboard go={go} saved={saved} selectedState={selectedState} />;

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="topline"><span>LICENCE LANE · OPEN PROTOTYPE</span><span>Built for the OpenAI / Codex hackathon</span><span className="topline-end">Not an official government service · Synthetic data only</span></div>
        <div className="header-main">
          <button className="brand" onClick={() => go('dashboard')} aria-label="Go to home">
            <span className="brand-mark"><span>↗</span></span>
            <span><strong>Licence Lane</strong><small>Citizen prototype</small></span>
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <button className={route.view === 'dashboard' ? 'active' : ''} onClick={() => go('dashboard')}>Home</button>
            <button className={['ll', 'dl'].includes(route.view) ? 'active' : ''} onClick={() => go('ll')}>Services</button>
            <button className={route.view === 'status' ? 'active' : ''} onClick={() => go('status')}>Application status</button>
            <button onClick={() => setShowAssistant(true)}>Help centre</button>
          </nav>
          <div className="header-tools">
            <button className="state-chip" onClick={() => setShowStatePicker(true)} aria-haspopup="dialog"><span className="pin">⌖</span><span className="state-chip-label">{selectedState}</span><span className="chevron">⌄</span></button>
            <button className="font-button" onClick={() => setScale(scale === 'large' ? 'normal' : 'large')} aria-label="Toggle larger text">A<span>A</span></button>
          </div>
        </div>
      </header>
      <div className="prototype-banner" role="status"><span>Prototype</span><p>This is an independent demo, not an official government service. Never enter real Aadhaar, OTP, payment, or identity details.</p></div>

      <main>{page}</main>

      <footer className="site-footer"><div><strong>Licence Lane</strong><span>A simpler journey for licence services.</span></div><div className="footer-links"><span>Privacy by design</span><span>Accessibility</span><span>Mock systems only</span></div><small>OpenAI / Codex hackathon prototype · 2026</small></footer>

      {showStatePicker && <StatePicker state={selectedState} onClose={() => setShowStatePicker(false)} onChange={(value) => { setSelectedState(value); setShowStatePicker(false); }} />}
      <aside className={`assistant-dock ${showAssistant ? 'open' : ''}`} aria-live="polite">
        {showAssistant && <div className="assistant-panel"><div className="assistant-heading"><span className="assistant-avatar">✦</span><div><strong>Need a hand?</strong><small>Pari is here to guide you</small></div><button onClick={() => setShowAssistant(false)} aria-label="Close help">×</button></div><p>Try asking “How do I renew my licence?” or call the citizen helpline.</p><button className="text-link" onClick={() => go('status')}>Check application status <span>→</span></button></div>}
        <button className="assistant-toggle" onClick={() => setShowAssistant(!showAssistant)} aria-expanded={showAssistant}><span>✦</span>{!showAssistant && <span>Help</span>}<span className="sr-only">Toggle help assistant</span></button>
      </aside>
    </div>
  );
}

function StatePicker({ state, onClose, onChange }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="state-dialog" role="dialog" aria-modal="true" aria-labelledby="state-title"><div className="dialog-top"><div className="dialog-icon">⌖</div><button className="close-button" onClick={onClose} aria-label="Close state selector">×</button></div><p className="eyebrow">Your service location</p><h2 id="state-title">Choose your state or UT</h2><p className="muted">We’ll show the right Regional Transport Office options for you. You can change this any time without losing your progress.</p><label className="field-label" htmlFor="state">State / Union Territory</label><select id="state" value={state} onChange={(e) => onChange(e.target.value)}>{states.map((item) => <option key={item}>{item}</option>)}</select><div className="dialog-note"><span>✓</span> Your choice is saved on this device</div><button className="button primary full" onClick={onClose}>Continue with {state} <span>→</span></button></div></div>;
}

function Dashboard({ go: navigate, saved, selectedState }) {
  const [query, setQuery] = useState('');
  const suggestions = useMemo(() => services.filter((service) => `${service.title} ${service.copy} ${service.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const hasProgress = saved.llStep || saved.dlStep;
  return <>
    <section className="hero container">
      <div className="hero-copy"><p className="eyebrow dark">{selectedState} · Citizen services</p><h1>Your licence,<br /><em>handled.</em></h1><p className="hero-lede">Clear steps, helpful guidance, and no waiting room. Start a service or pick up where you left off.</p><div className="search-wrap"><Icon label="Search">⌕</Icon><label className="sr-only" htmlFor="service-search">What do you need help with?</label><input id="service-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you need? Try “Renew my licence”" /><kbd>⌘ K</kbd>{query && <div className="search-results">{suggestions.length ? suggestions.map((s) => <button key={s.id} onClick={() => navigate(s.id)}><span>{s.title}</span><small>{s.copy}</small><b>→</b></button>) : <p>No service found. Try “learner”, “renew”, or “status”.</p>}</div>}</div><div className="hero-foot"><span><i className="status-dot"></i> Services are available now</span><span className="hero-foot-sep">·</span><span>Usually takes 10–15 min</span></div></div>
      <div className="hero-visual"><div className="sun-disc"></div><div className="road-card"><div className="road-lines"></div><div className="road-sign"><span>RTO</span><strong>{selectedState}</strong><small>YOUR JOURNEY<br />STARTS HERE</small></div><div className="route-badge"><span className="route-dot"></span><span>One place for all your<br /><strong>licence services</strong></span></div></div><div className="hero-stamp"><span>01</span><small>DESIGNED<br />FOR YOU</small></div></div>
    </section>

    <section className="problem-note container"><div><p className="eyebrow">Why this exists</p><h2>For first-time applicants, the hard part is knowing what comes next.</h2></div><div className="problem-grid"><div><span>Before</span><p>Scattered screens, repeated identity questions, and raw error pages.</p></div><div><span>Licence Lane</span><p>One guided journey, clear progress, and mock-safe data from start to finish.</p></div></div></section>

    {hasProgress && <section className="resume-strip container"><div className="resume-icon">↗</div><div className="resume-copy"><span className="eyebrow">Welcome back</span><strong>{saved.llStep ? 'New learner licence' : 'Driving licence service'}</strong><span>{saved.llStep ? `You’re on step ${saved.llStep} of 5` : `You’re on step ${saved.dlStep} of 3`} · Your details are saved on this device.</span></div><button className="button secondary" onClick={() => navigate(saved.llStep ? 'll' : 'dl', saved.llStep || saved.dlStep)}>Continue <span>→</span></button></section>}

    <section className="services-section container"><div className="section-heading"><div><p className="eyebrow">Start with a service</p><h2>What would you like to do?</h2></div><button className="text-link" onClick={() => navigate('ll')}>View all services <span>→</span></button></div><div className="service-grid">{services.map((service, index) => <button className={`service-card ${service.tone}`} key={service.id} onClick={() => navigate(service.id)}><div className="card-top"><span className="card-number">0{index + 1}</span><span className="service-icon"><Icon label={service.title}>{service.icon}</Icon></span></div><div><p className="eyebrow">{service.eyebrow}</p><h3>{service.title}</h3><p className="card-copy">{service.copy}</p></div><div className="card-bottom"><span>{service.tags[0]}</span><span>{service.tags[1]}</span><b>↗</b></div></button>)}</div></section>

    <section className="trust-section container"><div className="trust-intro"><p className="eyebrow">A calmer way to get things done</p><h2>Built around<br />your time.</h2><p>We’ve simplified the process so you always know what happens next. You can save and return at any point.</p></div><div className="trust-list"><div><span>01</span><div><strong>Save as you go</strong><p>Close the tab and come back to the same step on this device.</p></div></div><div><span>02</span><div><strong>Know where you stand</strong><p>Plain-language updates replace confusing error screens.</p></div></div><div><span>03</span><div><strong>Help when you need it</strong><p>Accessible guidance is always one tap away and never covers your actions.</p></div></div></div></section>
  </>;
}

function FlowShell({ type, title, intro, steps, step, children, onBack, saveLabel }) {
  return <section className="flow-page container"><div className="breadcrumb"><button onClick={() => go('dashboard')}>Home</button><span>/</span><span>{type === 'll' ? 'Learner licence' : type === 'dl' ? 'Driving licence services' : 'Application status'}</span></div><div className="demo-banner"><span>DEMO MODE</span> Use made-up details only. No Aadhaar, OTP, payment, or government record is connected.</div><div className="flow-layout"><aside className="flow-aside"><p className="eyebrow">{type === 'll' ? 'New application' : type === 'dl' ? 'Existing licence' : 'Find an update'}</p><h1>{title}</h1><p>{intro}</p><div className="aside-rule"></div><div className="aside-help"><span>✦</span><div><strong>Need help?</strong><p>Use the help button at the bottom right or call <b>1800-123-456</b>.</p></div></div></aside><div className="flow-main"><Progress steps={steps} current={step} /><div className="flow-card">{children}</div>{onBack && <button className="back-link" onClick={onBack}>← Back to {step > 1 ? 'previous step' : 'services'}</button>}<p className="privacy-note"><span>▣</span> Demo data stays in this browser; nothing is sent to an official system.</p></div></div></section>;
}

function Progress({ steps, current }) { return <div className="progress" aria-label={`Step ${current} of ${steps.length}`}><div className="progress-line"><span style={{ width: `${((current - 1) / (steps.length - 1)) * 100}%` }}></span></div>{steps.map((step, index) => <div className={`progress-step ${index + 1 === current ? 'current' : ''} ${index + 1 < current ? 'done' : ''}`} key={step}><span>{index + 1 < current ? '✓' : `0${index + 1}`}</span><small>{step}</small></div>)}</div>; }

function Field({ label, id, error, hint, required = true, children }) { return <div className={`field ${error ? 'has-error' : ''}`}><label className="field-label" htmlFor={id}>{label} {required ? <span aria-hidden="true">*</span> : <small>(optional)</small>}</label>{children}{hint && !error && <p className="field-hint">{hint}</p>}{error && <p className="field-error" role="alert"><span>!</span>{error}</p>}</div>; }

function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button' }) { return <button type={type} className={`button ${variant}`} onClick={onClick} disabled={disabled}>{children}</button>; }



function LearnerWizard({ route, go: navigate, onSave, saved }) {
  const [form, setForm] = useState(() => ({ category: 'General', holding: 'I do not hold a driving licence', auth: 'mock-ekyc', name: '', dob: '', mobile: '', otp: '', vehicle: 'Motor cycle without gear', photo: null, proof: null, slot: '', ...saved.llDemoForm }));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const step = Math.min(Math.max(route.step, 1), 5);
  useEffect(() => onSave({ llStep: step, llDemoForm: form }), [step, form]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const validate = () => { const next = {}; if (step === 1 && !form.auth) next.auth = 'Choose one demo verification method.'; if (step === 2) { if (!form.name.trim()) next.name = 'Enter a synthetic demo name.'; if (!/^\d{2}-\d{2}-\d{4}$/.test(form.dob)) next.dob = 'Use DD-MM-YYYY, for example 08-06-1998.'; if (!/^\d{10}$/.test(form.mobile)) next.mobile = 'Use a synthetic 10-digit number.'; if (form.auth === 'mock-otp' && form.otp !== '123456') next.otp = 'Use the demo OTP 123456.'; } if (step === 4 && !form.photo) next.photo = 'Add a mock photograph file.'; if (step === 5 && !form.slot) next.slot = 'Choose a mock test slot.'; setErrors(next); return !Object.keys(next).length; };
  const next = () => { if (validate()) navigate('ll', Math.min(step + 1, 5)); };
  return <FlowShell type="ll" title="Apply for a learner licence" intro="A complete, five-step demo journey for a first-time applicant. Every identity, upload, and payment dependency is mocked." steps={llSteps} step={step} onBack={() => step > 1 ? navigate('ll', step - 1) : navigate('dashboard')}>
    {step === 1 && <><StepHeading eyebrow="Step 1 of 5 · Start" title="Set up your demo application" copy="Choose the applicant type and verification route. We ask this once, then take you straight through." /><div className="info-callout"><span>i</span><p>Use made-up details only. This prototype does not connect to Aadhaar, DigiLocker, an OTP service, or a government record.</p></div><div className="form-grid"><Field label="Applicant category" id="demo-category"><select id="demo-category" value={form.category} onChange={(e) => set('category', e.target.value)}><option>General</option><option>Divyang</option><option>Ex-servicemen</option></select></Field><Field label="Current licence status" id="demo-holding" required={false}><select id="demo-holding" value={form.holding} onChange={(e) => set('holding', e.target.value)}><option>I do not hold a driving licence</option><option>I hold a driving licence</option></select></Field></div><Field label="Demo verification method" id="demo-auth" error={errors.auth}><div className="choice-grid"><label className={`choice ${form.auth === 'mock-ekyc' ? 'selected' : ''}`}><input type="radio" name="demo-auth" checked={form.auth === 'mock-ekyc'} onChange={() => set('auth', 'mock-ekyc')} /><span className="choice-icon">⌁</span><span><strong>Mock eKYC</strong><small>Prepares synthetic details instantly</small></span><b>✓</b></label><label className={`choice ${form.auth === 'mock-otp' ? 'selected' : ''}`}><input type="radio" name="demo-auth" checked={form.auth === 'mock-otp'} onChange={() => set('auth', 'mock-otp')} /><span className="choice-icon">▣</span><span><strong>Mock document + OTP</strong><small>Use demo code 123456</small></span><b>✓</b></label></div></Field><FormFooter onClick={next} label="Save and continue" /></>}
    {step === 2 && <><StepHeading eyebrow="Step 2 of 5 · Your details" title="Who are we helping today?" copy="Use synthetic details such as Ananya Sharma, 08-06-1998, and 9876543210." /><div className="form-grid"><Field label="Full name" id="demo-name" error={errors.name}><input id="demo-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ananya Sharma" /></Field><Field label="Date of birth" id="demo-dob" error={errors.dob}><input id="demo-dob" inputMode="numeric" value={form.dob} onChange={(e) => set('dob', dateMask(e.target.value))} placeholder="DD-MM-YYYY" /></Field></div><Field label="Demo mobile number" id="demo-mobile" error={errors.mobile}><input id="demo-mobile" inputMode="numeric" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" /></Field>{form.auth === 'mock-otp' && <div className="otp-row"><Field label="Demo one-time password" id="demo-otp" error={errors.otp} hint="No SMS is sent; use 123456."><input id="demo-otp" inputMode="numeric" value={form.otp} onChange={(e) => set('otp', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" /></Field><Button variant="outline" onClick={() => set('otp', '123456')}>Fill demo OTP</Button></div>}<Field label="Current address" id="demo-address" required={false}><textarea id="demo-address" placeholder="Use a made-up address" rows="3" /></Field><FormFooter onClick={next} label="Save and continue" /></>}
    {step === 3 && <><StepHeading eyebrow="Step 3 of 5 · Vehicle class" title="What will you ride?" copy="Choose the class for this synthetic application. You can see the next step before committing anything." /><Field label="Vehicle class" id="demo-vehicle"><select id="demo-vehicle" value={form.vehicle} onChange={(e) => set('vehicle', e.target.value)}><option>Motor cycle without gear</option><option>Motor cycle with gear</option><option>Light motor vehicle</option><option>Motor cycle with gear + Light motor vehicle</option></select></Field><div className="vehicle-preview"><div className="vehicle-art">✦</div><div><span className="eyebrow">Selected class</span><strong>{form.vehicle}</strong><p>A mock test slot will be offered after documents.</p></div><span className="check-circle">✓</span></div><FormFooter onClick={next} label="Save and continue" /></>}
    {step === 4 && <><StepHeading eyebrow="Step 4 of 5 · Documents" title="Add two mock documents" copy="Choose any local JPG, PNG, or PDF. The file name is shown for the demo; nothing is uploaded." /><div className="upload-grid"><UploadField label="Mock photograph" required error={errors.photo} onFile={(file) => set('photo', file?.name || 'mock-photo.jpg')} file={form.photo} /><UploadField label="Mock age & address proof" required={false} onFile={(file) => set('proof', file?.name || 'mock-proof.pdf')} file={form.proof} /></div><div className="info-callout warm"><span>i</span><p>This is the boundary between the citizen UI and a future document service. In production, files would be virus-scanned and stored with a short-lived reference.</p></div><FormFooter onClick={next} label="Choose a mock test slot" /></>}
    {step === 5 && (submitted ? <div className="completion-card"><span className="completion-mark">✓</span><p className="eyebrow">Demo application submitted</p><h2>Your learner licence journey is complete.</h2><p>A synthetic application was created and the next status view is ready. No payment or official record was created.</p><div className="reference-number"><span>Mock reference number</span><strong>LL-DEMO-20260822</strong></div><Button onClick={() => navigate('status', 2)}>View mock status timeline <span>→</span></Button></div> : <><StepHeading eyebrow="Step 5 of 5 · Test slot" title="Choose a learner test slot" copy="Pick a mock appointment to finish the journey. In production, availability would come from the selected RTO." /><div className="slot-grid">{['Tue · 27 Aug · 10:30 AM', 'Wed · 28 Aug · 2:00 PM', 'Sat · 31 Aug · 11:15 AM'].map((slot) => <label className={`slot-option ${form.slot === slot ? 'selected' : ''}`} key={slot}><input type="radio" name="demo-slot" checked={form.slot === slot} onChange={() => set('slot', slot)} /><span><strong>{slot}</strong><small>Mock RTO centre · selected location</small></span><b>✓</b></label>)}</div>{errors.slot && <p className="field-error" role="alert"><span>!</span>{errors.slot}</p>}<div className="completion-preview"><span>✓</span><p><strong>One last step</strong><br />Submit to create a synthetic reference and open the mock status timeline.</p></div><FormFooter onClick={() => { if (validate()) { setSubmitted(true); onSave({ llComplete: true }); } }} label="Submit demo application" /></>)}
  </FlowShell>;
}

function StepHeading({ eyebrow, title, copy }) { return <div className="step-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{copy}</p></div>; }
function FormFooter({ onClick, label }) { return <div className="form-footer"><Button onClick={onClick}>{label} <span>→</span></Button><span>Step saves automatically</span></div>; }
function UploadField({ label, required, error, onFile, file }) { return <div className={`upload-field ${error ? 'has-error' : ''}`}><span className="field-label">{label} {required ? <span>*</span> : <small>(optional)</small>}</span><label className="upload-box"><input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => onFile(e.target.files?.[0])} /><span className="upload-icon">↑</span><strong>{file || 'Choose a file'}</strong><small>{file ? 'Ready to upload' : 'or drag and drop here'}</small></label>{error && <p className="field-error" role="alert"><span>!</span>{error}</p>}</div>; }

function DrivingServicesLegacy({ route, go: navigate, onSave, saved }) {
  const [form, setForm] = useState(() => ({ service: saved.dlForm?.service || 'Renew my licence', dl: saved.dlForm?.dl || '', dob: saved.dlForm?.dob || '', captcha: saved.dlForm?.captcha || '', found: saved.dlForm?.found || false }));
  const [errors, setErrors] = useState({}); const [paymentStarted, setPaymentStarted] = useState(false); const step = Math.min(Math.max(route.step, 1), 3);
  useEffect(() => onSave({ dlStep: step, dlForm: form }), [step, form]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const validate = () => { const next = {}; if (step === 1 && !form.service) next.service = 'Choose a service to continue.'; if (step === 2) { if (form.dl.replace(/\W/g, '').length < 8) next.dl = 'Enter the driving licence number from your card.'; if (!/^\d{2}-\d{2}-\d{4}$/.test(form.dob)) next.dob = 'Use DD-MM-YYYY, for example 08-06-1998.'; if (form.captcha.toLowerCase() !== 'ready') next.captcha = 'Type READY to complete this demo challenge.'; } setErrors(next); return !Object.keys(next).length; };
  const next = () => { if (validate()) { if (step === 2) set('found', true); navigate('dl', Math.min(step + 1, 3)); } };
  return <FlowShell type="dl" title="Driving licence services" intro="Renew your licence, replace a lost card, or update your address without starting from scratch." steps={dlSteps} step={step} onBack={() => step > 1 ? navigate('dl', step - 1) : navigate('dashboard')}>
    {step === 1 && <><StepHeading eyebrow="Step 1 of 3 · Choose a service" title="What would you like to do?" copy="You can only choose one service per application." /><div className="service-options">{['Renew my licence', 'Get a duplicate licence', 'Change my address'].map((item, index) => <label className={`service-option ${form.service === item ? 'selected' : ''}`} key={item}><input type="radio" name="service" checked={form.service === item} onChange={() => set('service', item)} /><span className="mini-number">0{index + 1}</span><span><strong>{item}</strong><small>{index === 0 ? 'For an expired or expiring licence' : index === 1 ? 'If your licence is lost or damaged' : 'Update the address printed on your licence'}</small></span><b>✓</b></label>)}</div>{errors.service && <p className="field-error" role="alert"><span>!</span>{errors.service}</p>}<div className="info-callout warm"><span>i</span><p>Some services may need a medical certificate. We’ll let you know before payment.</p></div><FormFooter onClick={next} label="Continue to licence lookup" /></>}
    {step === 2 && <><StepHeading eyebrow="Step 2 of 3 · Find your licence" title="Let’s find your licence" copy="We need these details to show the services available for your licence." /><Field label="Driving licence number" id="dl" error={errors.dl} hint="You can paste it in — we’ll format it for you."><input id="dl" value={form.dl} onChange={(e) => set('dl', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20))} placeholder="e.g. DL-0420110012345" autoComplete="off" /></Field><Field label="Date of birth" id="dl-dob" error={errors.dob}><input id="dl-dob" inputMode="numeric" value={form.dob} onChange={(e) => set('dob', dateMask(e.target.value))} placeholder="DD-MM-YYYY" /></Field><div className="challenge"><div><span className="challenge-icon">✓</span><div><strong>Quick accessibility check</strong><p>No distorted image to read. Type <b>READY</b> to confirm you’re a person.</p></div></div><Field label="Challenge response" id="captcha" error={errors.captcha}><input id="captcha" value={form.captcha} onChange={(e) => set('captcha', e.target.value)} placeholder="Type READY" /></Field><button className="text-link" onClick={playChallengeAudio}>Play audio instead <span>◉</span></button></div><label className="check-label"><input type="checkbox" defaultChecked /><span>I agree that these details are mine and can be used to find my licence record.</span></label><FormFooter onClick={next} label="Find my licence" /></>}
    {step === 3 && <><StepHeading eyebrow="Step 3 of 3 · Confirm & pay" title="Your service is ready" copy="We found a synthetic match for your licence. Review the demo amount, then continue." /><div className="found-banner"><span>✓</span><div><strong>Mock licence match</strong><p>DL number ending in {form.dl.slice(-4) || '2345'} · {form.dob || '08-06-1998'}</p></div></div><div className="payment-summary"><div><span>Selected service</span><strong>{form.service}</strong></div><div><span>Estimated demo fee</span><strong>₹ 200 <small>Illustrative only · no payment taken</small></strong></div></div><div className="info-callout"><span>i</span><p>This is a simulated checkout. No payment details are requested and no real transaction will occur.</p></div><div className="form-footer"><Button onClick={() => setPaymentStarted(true)}>Open demo checkout <span>→</span></Button><span>Prototype only · no payment gateway connected</span></div>{paymentStarted && <CompletionCard title="Your service request is ready" copy="The payment hand-off is mocked for this prototype. In a live service, the next screen would be a trusted payment provider." number="DEMO-DL-20260822-5678" onClick={() => navigate('dashboard')} />}</>}
  </FlowShell>;
}

function DrivingServices({ route, go: navigate, onSave, saved }) {
  const [form, setForm] = useState(() => ({ service: saved.dlForm?.service || 'Renew my licence', dl: saved.dlForm?.dl || '', dob: saved.dlForm?.dob || '', captcha: saved.dlForm?.captcha || '' }));
  const [errors, setErrors] = useState({});
  const [complete, setComplete] = useState(false);
  const step = Math.min(Math.max(route.step, 1), 3);
  useEffect(() => onSave({ dlStep: step, dlForm: form }), [step, form]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const validate = () => { const next = {}; if (step === 2) { if (form.dl.replace(/\W/g, '').length < 8) next.dl = 'Enter a synthetic licence number.'; if (!/^\d{2}-\d{2}-\d{4}$/.test(form.dob)) next.dob = 'Use DD-MM-YYYY, for example 08-06-1998.'; if (form.captcha.toLowerCase() !== 'ready') next.captcha = 'Type READY to complete this demo challenge.'; } setErrors(next); return !Object.keys(next).length; };
  const next = () => { if (validate()) navigate('dl', Math.min(step + 1, 3)); };
  return <FlowShell type="dl" title="Driving licence services" intro="Renew your licence, replace a lost card, or update the address on your licence without starting from scratch." steps={dlSteps} step={step} onBack={() => step > 1 ? navigate('dl', step - 1) : navigate('dashboard')}>
    {step === 1 && <><StepHeading eyebrow="Step 1 of 3 · Choose a service" title="What would you like to do?" copy="You can only choose one service per application." /><div className="service-options">{['Renew my licence', 'Get a duplicate licence', 'Change my address'].map((item, index) => <label className={`service-option ${form.service === item ? 'selected' : ''}`} key={item}><input type="radio" name="demo-service" checked={form.service === item} onChange={() => set('service', item)} /><span className="mini-number">0{index + 1}</span><span><strong>{item}</strong><small>{index === 0 ? 'For an expired or expiring licence' : index === 1 ? 'If your licence is lost or damaged' : 'Update the address printed on your licence'}</small></span><b>✓</b></label>)}</div><div className="info-callout warm"><span>i</span><p>Some services may need a medical certificate. This demo will only show the next step.</p></div><FormFooter onClick={next} label="Continue to licence lookup" /></>}
    {step === 2 && <><StepHeading eyebrow="Step 2 of 3 · Find your licence" title="Let’s find your licence" copy="Use synthetic values only. You can paste the licence number into the field." /><Field label="Synthetic driving licence number" id="demo-dl" error={errors.dl} hint="Example: DL-0420110012345"><input id="demo-dl" value={form.dl} onChange={(e) => set('dl', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20))} placeholder="DL-0420110012345" /></Field><Field label="Date of birth" id="demo-dl-dob" error={errors.dob}><input id="demo-dl-dob" inputMode="numeric" value={form.dob} onChange={(e) => set('dob', dateMask(e.target.value))} placeholder="DD-MM-YYYY" /></Field><div className="challenge"><div><span className="challenge-icon">✓</span><div><strong>Quick accessibility check</strong><p>No distorted image to read. Type <b>READY</b> to confirm you’re a person.</p></div></div><Field label="Challenge response" id="demo-captcha" error={errors.captcha}><input id="demo-captcha" value={form.captcha} onChange={(e) => set('captcha', e.target.value)} placeholder="Type READY" /></Field><button className="text-link" onClick={() => document.getElementById('demo-captcha')?.focus()}>Play audio instead <span>◉</span></button></div><label className="check-label"><input type="checkbox" defaultChecked /><span>I agree that these synthetic details can be used for this demo lookup.</span></label><FormFooter onClick={next} label="Find my licence" /></>}
    {step === 3 && (complete ? <CompletionCard title="Your service request is ready" copy="The checkout hand-off is mocked. No payment details were requested, no payment was taken, and no government record was changed." number="DEMO-DL-20260822-5678" onClick={() => navigate('dashboard')} /> : <><StepHeading eyebrow="Step 3 of 3 · Confirm & pay" title="Your service is ready" copy="We found a synthetic match for your licence. Review the illustrative amount, then continue." /><div className="found-banner"><span>✓</span><div><strong>Mock licence match</strong><p>DL number ending in {form.dl.slice(-4) || '2345'} · {form.dob || '08-06-1998'}</p></div></div><div className="payment-summary"><div><span>Selected service</span><strong>{form.service}</strong></div><div><span>Estimated demo fee</span><strong>₹ 200 <small>Illustrative only · no payment taken</small></strong></div></div><div className="info-callout"><span>i</span><p>This is a simulated checkout. No payment details are requested and no real transaction will occur.</p></div><div className="form-footer"><Button onClick={() => setComplete(true)}>Open demo checkout <span>→</span></Button><span>Prototype only · no payment gateway connected</span></div></>)}
  </FlowShell>;
}

function StatusTracker({ route, go: navigate }) {
  const [form, setForm] = useState({ app: '', dob: '', captcha: '' }); const [error, setError] = useState(''); const step = Math.min(Math.max(route.step, 1), 2);
  const lookup = () => { if (form.app.length < 8 || !/^\d{2}-\d{2}-\d{4}$/.test(form.dob) || form.captcha.toLowerCase() !== 'ready') { setError('Check your application number, date of birth, and challenge response.'); return; } setError(''); navigate('status', 2); };
  return <FlowShell type="status" title="Track your application" intro="A quick, private view of what’s happening with your learner or driving licence application." steps={statusSteps} step={step} onBack={() => step > 1 ? navigate('status', 1) : navigate('dashboard')}>
    {step === 1 && <><StepHeading eyebrow="Step 1 of 2 · Find application" title="Where should we look?" copy="Use the application number on your receipt. You can paste it here." /><Field label="Application number" id="app" error={error && !form.app ? error : ''}><input id="app" value={form.app} onChange={(e) => setForm({ ...form, app: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="e.g. LL2026082201234" /></Field><Field label="Date of birth" id="status-dob"><input id="status-dob" inputMode="numeric" value={form.dob} onChange={(e) => setForm({ ...form, dob: dateMask(e.target.value) })} placeholder="DD-MM-YYYY" /></Field><div className="challenge compact"><div><span className="challenge-icon">✓</span><div><strong>Accessible challenge</strong><p>Type <b>READY</b> or choose the audio option.</p></div></div><input aria-label="Challenge response" value={form.captcha} onChange={(e) => setForm({ ...form, captcha: e.target.value })} placeholder="Type READY" /><button className="text-link" onClick={playChallengeAudio}>Audio <span>◉</span></button></div>{error && <p className="form-error" role="alert"><span>!</span>{error}</p>}<FormFooter onClick={lookup} label="Show my status" /></>}
    {step === 2 && <><StepHeading eyebrow="Step 2 of 2 · Application timeline" title="Here’s your latest update" copy={`Application ${form.app || 'LL2026082201234'} · Last updated a few minutes ago`} /><div className="status-summary"><span className="success-symbol">✓</span><div><strong>Application in progress</strong><p>Your documents have been received and are being reviewed.</p></div><span className="status-pill">On track</span></div><div className="timeline"><TimelineItem done title="Application submitted" date="22 Aug 2026 · 10:12 AM" detail="Your application and payment were received." /><TimelineItem done title="Documents verified" date="22 Aug 2026 · 10:26 AM" detail="Identity and address proof accepted." /><TimelineItem current title="Learner test slot" date="Next step" detail="Choose a test centre and appointment time." action="Choose a slot" onClick={() => navigate('ll', 3)} /><TimelineItem title="Licence issued" date="After you pass" detail="Your digital licence will be available here." /></div><button className="button outline full" onClick={() => navigate('dashboard')}>Back to services <span>→</span></button></>}
  </FlowShell>;
}

function CompletionCard({ title, copy, number, onClick }) { return <div className="completion-card"><span className="completion-mark">✓</span><p className="eyebrow">Saved successfully</p><h2>{title}</h2><p>{copy}</p><div className="reference-number"><span>Demo reference number</span><strong>{number}</strong></div><Button onClick={onClick}>Back to services <span>→</span></Button></div>; }
function TimelineItem({ done, current, title, date, detail, action, onClick }) { return <div className={`timeline-item ${done ? 'done' : ''} ${current ? 'current' : ''}`}><div className="timeline-marker">{done ? '✓' : current ? '•' : ''}</div><div className="timeline-copy"><span className="eyebrow">{date}</span><strong>{title}</strong><p>{detail}</p>{action && <button className="text-link" onClick={onClick}>{action} <span>→</span></button>}</div></div>; }
function playChallengeAudio() { if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance('Type READY to complete the accessibility challenge.')); }
function dateMask(value) { const digits = value.replace(/\D/g, '').slice(0, 8); return digits.length > 4 ? `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits; }

createRoot(document.getElementById('root')).render(<App />);
