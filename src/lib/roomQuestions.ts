import type { rooms } from "./schema";

export type RoomQuestion = {
  index: number;
  taskRaw: string;
  taskNormalised: string;
  canonicalAnswer?: string | null;
  category: string;
  title: string;
  difficulty: string;
  language?: string | null;
  starterCode?: string | null;
  publicTests?: { input: string; expectedOutput: string }[];
  hiddenTests?: { input: string; expectedOutput: string }[];
};

type RoomRow = typeof rooms.$inferSelect;

function firstNonEmptyText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return "";
}

/** Player-facing challenge text — never prefer an empty normalised string over raw task. */
export function getChallengePromptText(
  question:
    | {
        taskNormalised?: string | null;
        taskRaw?: string | null;
        title?: string | null;
      }
    | null
    | undefined,
  room: {
    taskNormalised?: string | null;
    taskRaw?: string | null;
    title?: string | null;
    name: string;
  },
): string {
  return (
    firstNonEmptyText(
      question?.taskNormalised,
      question?.taskRaw,
      question?.title,
      room.taskNormalised,
      room.taskRaw,
      room.title,
      room.name,
    ) || "Challenge prompt unavailable — ask the host to repost the task."
  );
}

/** Normalise stored room data into a question list for live play. */
export function getRoomQuestions(room: RoomRow): RoomQuestion[] {
  if (room.questionsJson) {
    try {
      const parsed = JSON.parse(room.questionsJson) as RoomQuestion[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q, i) => {
          const taskRaw = firstNonEmptyText(q.taskRaw, room.taskRaw) || room.taskRaw;
          const taskNormalised =
            firstNonEmptyText(q.taskNormalised, q.taskRaw, taskRaw, room.taskNormalised, room.taskRaw) ||
            taskRaw;
          return {
            ...q,
            index: q.index ?? i,
            taskRaw,
            taskNormalised,
          };
        });
      }
    } catch {
      // fall through to single-question fallback
    }
  }

  const taskRaw = room.taskRaw;
  const taskNormalised = firstNonEmptyText(room.taskNormalised, room.taskRaw) || taskRaw;

  return [
    {
      index: 0,
      taskRaw,
      taskNormalised,
      canonicalAnswer: room.canonicalAnswer,
      category: room.category ?? "trivia",
      title: room.title ?? room.name,
      difficulty: room.difficulty ?? "rookie",
      language: room.language,
      starterCode: room.starterCode,
    },
  ];
}

export function totalQuestions(room: RoomRow): number {
  return getRoomQuestions(room).length;
}
