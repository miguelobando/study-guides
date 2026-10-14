import { useEffect, useState } from 'react';
import { InterviewScreen } from './components/InterviewScreen';
import { SetupScreen } from './components/SetupScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { QUESTIONS, QUESTIONS_BY_ID } from './data';
import { advance, createSession, DEFAULT_CONFIG, finishEarly, recordAnswer } from './lib/session';
import { clearSession, loadConfig, loadSession, saveConfig, saveSession } from './lib/storage';
import type { AnswerRecord, Session, SessionConfig } from './types';

function initialConfig(): SessionConfig {
  return { ...DEFAULT_CONFIG, ...loadConfig() };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  // A stored, unfinished session is offered on the setup screen instead of jumping straight into it.
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (session) saveSession(session);
    else clearSession();
  }, [session]);

  function start(config: SessionConfig) {
    saveConfig(config);
    setSession(createSession(config, QUESTIONS));
    setActive(true);
  }

  function handleRecord(record: AnswerRecord, shouldAdvance: boolean) {
    setSession((s) => {
      if (!s) return s;
      const updated = recordAnswer(s, record);
      return shouldAdvance ? advance(updated) : updated;
    });
  }

  function handleNext() {
    setSession((s) => (s ? advance(s) : s));
  }

  function handleEnd(pending?: AnswerRecord) {
    setSession((s) => {
      if (!s) return s;
      return finishEarly(pending ? recordAnswer(s, pending) : s);
    });
  }

  function restart() {
    setSession(null);
    setActive(false);
  }

  if (session?.finishedAt) {
    return <SummaryScreen session={session} questionsById={QUESTIONS_BY_ID} onRestart={restart} />;
  }

  if (session && active) {
    return (
      <InterviewScreen
        session={session}
        questionsById={QUESTIONS_BY_ID}
        onRecord={handleRecord}
        onNext={handleNext}
        onEnd={handleEnd}
      />
    );
  }

  return (
    <SetupScreen
      questions={QUESTIONS}
      initialConfig={initialConfig()}
      resumable={session}
      onStart={start}
      onResume={() => setActive(true)}
      onDiscard={restart}
    />
  );
}
