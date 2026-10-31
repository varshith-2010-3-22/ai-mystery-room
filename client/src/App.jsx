import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, Clock3, Fingerprint, LockKeyhole, Search, Shield, Sparkles, TriangleAlert, X } from 'lucide-react';
import { api, errorMessage } from './services/api';

const difficultyData = { easy: { label: 'Field Notes', suspects: 3, clues: 5, hints: 2, duration: '10–15 min' }, medium: { label: 'Case File', suspects: 4, clues: 7, hints: 3, duration: '20–30 min' }, hard: { label: 'Cold Case', suspects: 5, clues: 9, hints: 3, duration: '30–45 min' } };
const sample = 'During a rain-lashed gala at the old Marlowe Hotel, the only key to the sealed west wing vanished from the curator’s locked desk.';

function Shell({ children }) { return <div className="min-h-screen"><header className="topbar"><Link to="/" className="wordmark"><span className="brand-seal"><Fingerprint size={18}/></span><span>MYSTERY <i>ROOM</i></span></Link><nav><Link to="/create">New investigation <ArrowUpRight size={14}/></Link><span className="nav-divider"/><span className="nav-caption">PRIVATE INVESTIGATIONS · EST. 2024</span></nav></header>{children}<footer className="footer"><span>MR / FIELD OFFICE</span><span>Every detail has a place.</span><span>BUILT FOR THE CURIOUS</span></footer></div> }
function Stamp({ children = 'CASE FILE / 001' }) { return <span className="stamp"><span className="stamp-dot"/>{children}</span> }
function Button({ to, onClick, children, variant = 'primary', disabled = false, type = 'button' }) { const cls = `button button-${variant}`; return to ? <Link className={cls} to={to}>{children}<ArrowRight size={16}/></Link> : <button className={cls} onClick={onClick} disabled={disabled} type={type}>{children}<ArrowRight size={16}/></button> }
function ErrorNotice({ message, retry }) { return <div className="error-notice" role="alert"><TriangleAlert size={17}/><span>{message}</span>{retry && <button onClick={retry}>Try again</button>}</div> }

function Home() { return <Shell><main>
  <section className="hero wrap">
    <div className="hero-copy"><Stamp>AN INTERACTIVE DETECTIVE GAME</Stamp><h1>Every clue tells<br/>a <em>story.</em></h1><p className="hero-sub">Every suspect hides one.</p><p className="hero-body">Step into the room. Read the evidence. Decide what really happened—before the trail goes cold.</p><Button to="/create">Start an investigation</Button><div className="hero-meta"><span><Shield size={14}/> YOUR CASE. YOUR CALL.</span><span>NO TWO MYSTERIES ALIKE</span></div></div>
    <div className="hero-art" aria-label="Illustrated detective case file and evidence board"><div className="board-grid"/><div className="case-paper"><div className="paper-top"><span>PRIVATE / CONFIDENTIAL</span><span>MR—0248</span></div><div className="paper-title">THE MARLOWE<br/><i>DISAPPEARANCE</i></div><div className="paper-rule"/><div className="paper-copy">A locked room. A missing key.<br/>Four people with reasons to lie.</div><div className="paper-bottom"><span>OPEN FILE</span><ChevronRight size={14}/></div><span className="paper-stamp">ACTIVE<br/>CASE</span></div><div className="evidence-tag tag-one"><span className="tag-pin"/> 01 / ACCESS LOG</div><div className="evidence-tag tag-two"><span className="tag-pin"/> 02 / WITNESS STATEMENT</div><div className="thread thread-a"/><div className="thread thread-b"/><div className="artifact-label"><span>FIG. 01</span> THE EVIDENCE BOARD</div><div className="board-index">INVESTIGATION<br/>IN PROGRESS <span>●</span></div></div>
  </section>
  <section className="how wrap"><div className="section-kicker"><span>01—03</span> THE METHOD</div><div className="how-heading"><h2>Think like a detective.<br/><em>Trust the evidence.</em></h2><p>No guesswork required. Every answer is buried in the details you uncover.</p></div><div className="steps"><article><span className="step-num">01</span><BookOpen/><h3>Open a case</h3><p>Set the scene. Choose your difficulty. A new mystery is assembled around your premise.</p></article><article><span className="step-num">02</span><Search/><h3>Examine the evidence</h3><p>Meet the suspects. Find the clues. Ask for a nudge when the trail gets difficult.</p></article><article><span className="step-num">03</span><Fingerprint/><h3>Make your call</h3><p>Accuse the person you believe did it. Your score reflects how carefully you investigated.</p></article></div></section>
  <section className="difficulty-preview wrap"><div><Stamp>CHOOSE YOUR DEPTH</Stamp><h2>How far will<br/>you <em>dig?</em></h2></div><div className="preview-grid">{Object.entries(difficultyData).map(([key,d],i)=><article key={key}><span>0{i+1} / {key.toUpperCase()}</span><h3>{d.label}</h3><p>{d.suspects} suspects · {d.clues} clues</p><small>{d.duration}</small></article>)}</div></section>
  <section className="last-call wrap"><span>THE ROOM IS WAITING.</span><Button to="/create" variant="secondary">Open your first case</Button></section>
</main></Shell> }

function Create() { const [premise,setPremise]=useState(''); const [difficulty,setDifficulty]=useState('medium'); const [busy,setBusy]=useState(false); const [waitStep,setWaitStep]=useState(0); const [error,setError]=useState(''); const navigate=useNavigate();
 useEffect(()=>{if(!busy){setWaitStep(0);return;}const timer=window.setTimeout(()=>setWaitStep(1),1800);return()=>window.clearTimeout(timer);},[busy]);
 async function submit(e){e.preventDefault();setError('');if(premise.trim().length<20||premise.trim().length>500){setError('Your premise needs between 20 and 500 characters.');return;}setBusy(true);try{const {data}=await api.post('/cases',{premise:premise.trim(),difficulty});navigate(`/investigation/${data.case.id}`);}catch(err){setError(errorMessage(err));}finally{setBusy(false);}}
 return <Shell><main className="page-wrap create-page"><div className="breadcrumb"><Link to="/">FIELD OFFICE</Link><ChevronRight size={13}/> NEW CASE</div><div className="page-heading"><Stamp>INTAKE / NEW INVESTIGATION</Stamp><h1>Set the <em>scene.</em></h1><p>Give us the first thread. We’ll build the mystery around it.</p></div><form className="create-form" onSubmit={submit}>
  <label htmlFor="premise">THE PREMISE <span>20—500 CHARACTERS</span></label><textarea id="premise" value={premise} maxLength={500} onChange={e=>setPremise(e.target.value)} placeholder="A priceless painting vanished during the museum's midnight reopening..." aria-describedby="premise-help"/><div id="premise-help" className="textarea-meta"><span>Keep it fictional. The details are yours to choose.</span><span>{premise.length} / 500</span></div><button type="button" className="sample-link" onClick={()=>setPremise(sample)}><Sparkles size={14}/> USE SAMPLE PREMISE</button>
  <fieldset className="difficulty-select"><legend>SELECT DIFFICULTY <span>YOU CAN’T CHANGE THIS MID-CASE</span></legend><div className="difficulty-options">{Object.entries(difficultyData).map(([key,d],i)=><label key={key} className={`difficulty-option ${difficulty===key?'selected':''}`}><input type="radio" name="difficulty" value={key} checked={difficulty===key} onChange={()=>setDifficulty(key)}/><span className="option-number">0{i+1}</span><span className="option-title">{d.label}</span><span className="option-spec">{d.suspects} suspects · {d.clues} clues · {d.hints} hints</span><span className="option-duration"><Clock3 size={12}/>{d.duration}</span><span className="radio-dot"/></label>)}</div></fieldset>
  {error&&<ErrorNotice message={error}/>} {busy&&<p className="generation-status" role="status"><span className="stamp-dot"/>{waitStep===0?'Sending your premise to the case room…':'Waiting for your mystery to take shape…'}</p>}<div className="form-bottom"><span><LockKeyhole size={14}/> Your answer stays on the server until accusation.</span><Button disabled={busy} type="submit">
  {busy?'Preparing your case…':'Generate mystery'}
</Button></div>
  </form><aside className="intake-note"><span>NOTE FROM THE DESK</span><p>We’ll create suspects, evidence, and a solution. You’ll need to discover the clues before they can help your score.</p></aside></main></Shell> }

function Investigation() { const {id}=useParams();const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [selected,setSelected]=useState('');const [confirm,setConfirm]=useState(false);const navigate=useNavigate();
 async function load(){setLoading(true);setError('');try{const r=await api.get(`/cases/${id}`);if(r.data.case.status==='completed'){navigate(`/results/${id}`,{replace:true});return;}setData(r.data.case);}catch(e){setError(errorMessage(e));}finally{setLoading(false);}}
 useEffect(()=>{load();},[id]);
 async function discover(clueId){setBusy(true);setError('');try{const r=await api.post(`/cases/${id}/clues/${clueId}/discover`);setData(r.data.case);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 async function hint(){setBusy(true);setError('');try{const r=await api.post(`/cases/${id}/hints`);setData(r.data.case);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 async function accuse(){if(!selected)return;setBusy(true);setError('');try{await api.post(`/cases/${id}/accuse`,{suspectId:selected});navigate(`/results/${id}`);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 if(loading)return <Shell><main className="page-wrap loading"><div className="loader-mark"><Fingerprint/></div><Stamp>ACCESSING CASE FILE</Stamp><p>Gathering the evidence…</p></main></Shell>;
 if(error&&!data)return <Shell><main className="page-wrap"><ErrorNotice message={error} retry={load}/></main></Shell>;
 if(!data)return null;
 const discovered=new Set(data.discoveredClues.map(c=>c.id));
 return <Shell><main className="page-wrap investigation"><div className="breadcrumb"><Link to="/">FIELD OFFICE</Link><ChevronRight size={13}/> ACTIVE CASE</div><div className="case-heading"><div><Stamp>CASE / {id.slice(-6).toUpperCase()}</Stamp><h1>{data.title}</h1><p>{data.difficulty.toUpperCase()} INVESTIGATION · OPEN FILE</p></div><div className="progress-card"><span>CLUES UNCOVERED</span><strong>{String(data.progress.discovered).padStart(2,'0')}<i> / {String(data.progress.total).padStart(2,'0')}</i></strong><div className="progress-track"><span style={{width:`${data.progress.discovered/data.progress.total*100}%`}}/></div></div></div>
 {error&&<ErrorNotice message={error}/>}<section className="briefing"><div className="block-label"><BookOpen size={15}/> THE BRIEFING</div><p>{data.story}</p></section>
 <div className="investigation-grid"><div className="evidence-column"><section><div className="section-head"><div><span className="section-index">01 / THE EVIDENCE</span><h2>Clue ledger</h2></div><span className="subtle-count">{discovered.size} OF {data.clues.length} RECOVERED</span></div><div className="clue-list">{data.clues.map((clue,i)=>{const found=discovered.has(clue.id);const full=data.discoveredClues.find(c=>c.id===clue.id);return <article className={`clue-row ${found?'found':''}`} key={clue.id}><span className="clue-number">{String(i+1).padStart(2,'0')}</span><div className="clue-content"><span className="clue-location">{found?full.location:'UNEXAMINED LOCATION'}</span><h3>{found?full.title:'Evidence sealed'}</h3>{found?<><p>{full.description}</p><small>WHY IT MATTERS / {full.significance}</small></>:<p className="locked-copy">The contents have not yet been examined.</p>}</div>{!found?<button className="discover-btn" onClick={()=>discover(clue.id)} disabled={busy} aria-label={`Discover clue ${i+1}`}>EXAMINE <ArrowRight size={14}/></button>:<span className="found-mark"><Check size={15}/> LOGGED</span>}</article>})}</div></section>
 <section className="story-panel"><span className="section-index">02 / CASE NOTES</span><h2>Read the room.</h2><p>{data.premise}</p><div className="case-note-line"/></section></div>
 <aside className="suspect-column"><div className="section-head"><div><span className="section-index">03 / PERSONS OF INTEREST</span><h2>Suspect files</h2></div></div><div className="suspect-list">{data.suspects.map((s,i)=><article className="suspect-card" key={s.id}><div className="suspect-head"><span className="suspect-avatar">{s.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><div><span className="suspect-index">PERSON {String(i+1).padStart(2,'0')}</span><h3>{s.name}</h3><span className="suspect-role">{s.role}</span></div><ChevronRight size={15}/></div><p>{s.description}</p><details><summary>STATEMENT & ALIBI <ChevronRight size={12}/></summary><p>“{s.statement}”</p><p className="alibi">ALIBI / {s.alibi}</p>{s.publicFacts.map((f,j)=><p key={j} className="fact">FILE NOTE / {f}</p>)}</details></article>)}</div>
 <section className="hint-panel"><div className="hint-title"><CircleHelp size={17}/><span>THE DETECTIVE’S NUDGE</span></div><p>Stuck? A hint can point you toward the right line of inquiry.</p><div className="hint-used">{data.hints.map((h,i)=><div key={h.id}><span>HINT {String(i+1).padStart(2,'0')}</span><p>{h.text}</p></div>)}</div><button onClick={hint} disabled={busy||data.hintsUsed>=data.hintLimit} className="hint-button">{data.hintsUsed>=data.hintLimit?'NO HINTS REMAIN':`REQUEST A HINT · ${data.hintLimit-data.hintsUsed} LEFT`}<ArrowRight size={14}/></button><small>Each hint deducts 10 points.</small></section></aside></div>
 <section className="accusation-bar"><div><span>WHEN THE EVIDENCE IS ENOUGH</span><p>Choose carefully. An accusation closes the case.</p></div><Button to={`/accuse/${id}`} variant="secondary">Make an accusation</Button></section>
 </main></Shell>
}

function Accuse() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await api.get(`/cases/${id}`);
      if (r.data.case.status === 'completed') {
        navigate(`/results/${id}`, { replace: true });
        return;
      }
      setData(r.data.case);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAccuse(e) {
    if (e) e.preventDefault();
    if (!selected) {
      setError('Please choose a suspect to accuse.');
      return;
    }
    if (!confirmed) {
      setError('Please check the confirmation box to submit your final verdict.');
      return;
    }
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/cases/${id}/accuse`, { suspectId: selected });
      navigate(`/results/${id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (loading) return <Shell><main className="page-wrap loading"><div className="loader-mark"><Fingerprint /></div><Stamp>ACCESSING CASE FILE</Stamp><p>Gathering suspect dossiers for final accusation…</p></main></Shell>;
  if (error && !data) return <Shell><main className="page-wrap"><ErrorNotice message={error} retry={load} /></main></Shell>;
  if (!data) return null;

  const chosenSuspect = data.suspects.find(s => s.id === selected);

  return (
    <Shell>
      <main className="page-wrap accuse-page">
        <div className="breadcrumb">
          <Link to="/">FIELD OFFICE</Link>
          <ChevronRight size={13} />
          <Link to={`/investigation/${id}`}>CASE / {id.slice(-6).toUpperCase()}</Link>
          <ChevronRight size={13} />
          ACCUSATION
        </div>

        <div className="page-heading">
          <Stamp>FINAL STAGE / IRREVOCABLE CALL</Stamp>
          <h1>Accuse a <em>suspect.</em></h1>
          <p>Every clue has been weighed. Choose the culprit to close the case.</p>
        </div>

        <div className="create-form" style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #36373a', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <span className="section-index">CASE REFERENCE</span>
              <h3 style={{ font: '22px Georgia,serif', margin: '4px 0 0', color: '#e5e0d4' }}>{data.title}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="subtle-count">DISCOVERED EVIDENCE</span>
              <p style={{ margin: '4px 0 0', font: '13px Georgia,serif', color: 'var(--amber)' }}>
                {data.progress.discovered} of {data.progress.total} Clues · {data.hintsUsed} Hints Used
              </p>
            </div>
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ width: '100%', color: '#d3d0c8', fontSize: '9px', letterSpacing: '.14em', fontWeight: 700, marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
              SELECT THE CULPRIT <span>CHOOSE ONE PERSON OF INTEREST</span>
            </legend>

            <div className="accuse-list" style={{ gap: '12px' }}>
              {data.suspects.map((s, i) => (
                <label key={s.id} className={`suspect-card ${selected === s.id ? 'chosen' : ''}`} style={{ display: 'block', cursor: 'pointer', transition: 'border-color .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="radio"
                      name="accuseSuspect"
                      value={s.id}
                      checked={selected === s.id}
                      onChange={() => { setSelected(s.id); setError(''); }}
                      aria-label={`Accuse ${s.name}`}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span className="suspect-index">SUSPECT {String(i + 1).padStart(2, '0')}</span>
                        {selected === s.id && <span style={{ color: 'var(--amber)', fontSize: '9px', fontWeight: 'bold' }}>SELECTED</span>}
                      </div>
                      <h3 style={{ font: '18px Georgia,serif', margin: '3px 0' }}>{s.name}</h3>
                      <span className="suspect-role">{s.role}</span>
                    </div>
                  </div>
                  <p style={{ margin: '10px 0 6px', fontSize: '11px', color: '#a5a6a6', lineHeight: 1.6 }}>{s.description}</p>
                  <div style={{ fontSize: '9px', color: '#88898c', borderTop: '1px solid #2a2b2e', paddingTop: '6px' }}>
                    <span>ALIBI: {s.alibi}</span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {chosenSuspect && (
            <div style={{ margin: '20px 0', padding: '14px', background: '#211f1a', border: '1px solid #625130' }}>
              <span className="stamp"><span className="stamp-dot" />CONFIRMATION REQUIRED</span>
              <p style={{ font: 'italic 13px Georgia,serif', color: '#e0d8c7', margin: '8px 0' }}>
                You are formally naming <strong>{chosenSuspect.name}</strong> ({chosenSuspect.role}) as the culprit.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '10px', color: '#c7c4bc', cursor: 'pointer', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => { setConfirmed(e.target.checked); setError(''); }}
                  style={{ accentColor: 'var(--amber)' }}
                />
                <span>I understand this accusation is final and concludes the investigation.</span>
              </label>
            </div>
          )}

          {error && <ErrorNotice message={error} />}

          <div className="form-bottom" style={{ marginTop: '20px' }}>
            <Link to={`/investigation/${id}`} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#929397' }}>
              ← Return to evidence room
            </Link>
            <Button onClick={handleAccuse} disabled={!selected || !confirmed || busy}>
              {busy ? 'Submitting accusation…' : 'Submit final accusation'}
            </Button>
          </div>
        </div>
      </main>
    </Shell>
  );
}

function Results() { const {id}=useParams();const [result,setResult]=useState(null);const [error,setError]=useState('');async function load(){try{const r=await api.get(`/cases/${id}/result`);setResult(r.data.result);}catch(e){setError(errorMessage(e));if(e.response?.status===409)window.location.replace(`/investigation/${id}`);}}useEffect(()=>{load();},[id]);return <Shell><main className="page-wrap results-page"><div className="breadcrumb"><Link to="/">FIELD OFFICE</Link><ChevronRight size={13}/> CASE CLOSED</div>{error&&!result?<ErrorNotice message={error} retry={load}/>:!result?<div className="loading"><Stamp>REVIEWING THE EVIDENCE</Stamp><p>Retrieving your case result…</p></div>:<><div className={`verdict ${result.isCorrect?'solved':'unsolved'}`}><Stamp>FINAL REPORT / {id.slice(-6).toUpperCase()}</Stamp><span className="verdict-label">{result.isCorrect?'CASE SOLVED':'WRONG SUSPECT'}</span><h1>{result.isCorrect?'You followed the evidence.':'The trail went cold.'}</h1><p>{result.isCorrect?'Your conclusion holds up under scrutiny.':'A different suspect was responsible. Review the explanation and try a new case.'}</p></div><div className="result-grid"><section className="culprit-panel"><span className="section-index">THE CULPRIT</span><h2>{result.culprit.name}</h2><p>{result.culprit.role}</p><div className="paper-rule"/><span className="section-index">WHY IT HAPPENED</span><p className="explanation">{result.explanation}</p></section><section className="score-panel"><span className="section-index">INVESTIGATION SCORE</span><strong>{result.score.finalScore}<small>PTS</small></strong><div className="score-lines"><p><span>Base points {result.isCorrect?'(correct accusation)':'(wrong accusation)'}</span><b>+{result.score.basePoints}</b></p><p><span>Clues recovered · {result.cluesDiscovered} × 5</span><b>+{result.score.cluePoints}</b></p><p><span>Hints used · {result.hintsUsed} × 10</span><b>−{result.score.hintPenalty}</b></p><p className="score-total"><span>FINAL SCORE</span><b>{result.score.finalScore}</b></p></div></section></div><div className="result-actions"><Button to="/create">Play another case</Button><Link to="/">Return to field office <ArrowUpRight size={14}/></Link></div></>}</main></Shell>}

function NotFound(){return <Shell><main className="page-wrap not-found"><Stamp>NO FILE FOUND / 404</Stamp><h1>This trail ends <em>here.</em></h1><p>The page you’re looking for isn’t in the case archive.</p><Button to="/">Return to the field office</Button></main></Shell>}
export default function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/create" element={<Create/>}/><Route path="/investigation/:id" element={<Investigation/>}/><Route path="/accuse/:id" element={<Accuse/>}/><Route path="/results/:id" element={<Results/>}/><Route path="*" element={<NotFound/>}/></Routes>}

