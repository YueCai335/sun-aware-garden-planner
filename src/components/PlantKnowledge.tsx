"use client";

import { FormEvent, useState } from "react";

import type { Garden } from "@/lib/gardenWorkspace";
import { askPlantKnowledge, type PlantKnowledgeAnswer } from "@/lib/gardenWorkspaceApi";

export function PlantKnowledge({
  gardens,
  initialGardenId,
  isServerBacked,
  workspaceId,
}: {
  gardens: Garden[];
  initialGardenId: string;
  isServerBacked: boolean;
  workspaceId?: string;
}) {
  const [gardenId, setGardenId] = useState(initialGardenId);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<PlantKnowledgeAnswer>();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceId || !question.trim()) return;
    setError("");
    setIsLoading(true);
    try {
      setAnswer(await askPlantKnowledge(workspaceId, { question: question.trim(), gardenId: gardenId || undefined }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The garden server could not answer this question.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isServerBacked || !workspaceId) {
    return (
      <section className="operations-content season-planner" aria-labelledby="plant-knowledge-heading">
        <p className="section-eyebrow">Plant knowledge</p>
        <h2 id="plant-knowledge-heading">Import gardens to PostgreSQL first</h2>
        <p className="section-context">Plant Knowledge retrieves verified source cards through the local API.</p>
      </section>
    );
  }

  return (
    <section className="operations-content season-planner" aria-labelledby="plant-knowledge-heading">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Plant knowledge</p>
          <h2 id="plant-knowledge-heading">Ask a garden question</h2>
          <p className="section-context">Answers use a small reviewed knowledge library and show the sources used.</p>
        </div>
      </div>
      <form className="care-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="knowledge-garden">Garden context (optional)</label>
          <select disabled={isLoading} id="knowledge-garden" onChange={(event) => setGardenId(event.target.value)} value={gardenId}>
            <option value="">No garden context</option>
            {gardens.map((garden) => <option key={garden.id} value={garden.id}>{garden.name}</option>)}
          </select>
        </div>
        <div className="field care-note-field">
          <label htmlFor="knowledge-question">Question</label>
          <textarea id="knowledge-question" onChange={(event) => setQuestion(event.target.value)} placeholder="My tomato leaves have a white coating. What should I observe first?" required rows={5} value={question} />
        </div>
        <div className="form-actions">
          <button className="primary-button" disabled={isLoading} type="submit">{isLoading ? "Searching sources..." : "Ask Plant Knowledge"}</button>
        </div>
      </form>
      {error ? <p className="workspace-message" role="alert">{error}</p> : null}
      {answer ? <KnowledgeAnswer answer={answer} /> : null}
    </section>
  );
}

function KnowledgeAnswer({ answer }: { answer: PlantKnowledgeAnswer }) {
  return (
    <section className="knowledge-answer" aria-labelledby="knowledge-answer-heading">
      <h3 id="knowledge-answer-heading">Answer</h3>
      <p>{answer.answer}</p>
      <p className="field-hint">Confidence: {answer.confidence}</p>
      {answer.followUpQuestions.length ? <><h4>Useful follow-up questions</h4><ul>{answer.followUpQuestions.map((question) => <li key={question}>{question}</li>)}</ul></> : null}
      <h4>Sources</h4>
      {answer.citations.length ? <ul className="knowledge-citations">{answer.citations.map((citation) => <li key={citation.sourceKey}><a href={citation.sourceUrl} rel="noreferrer" target="_blank">{citation.title}</a><span>{citation.publisher} · reviewed {citation.reviewedOn}</span><p>{citation.excerpt}</p></li>)}</ul> : <p className="field-hint">Add more plant and symptom details to search the current library.</p>}
    </section>
  );
}
