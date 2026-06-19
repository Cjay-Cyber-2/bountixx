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

/** Normalise stored room data into a question list for live play. */
export function getRoomQuestions(room: RoomRow): RoomQuestion[] {
  if (room.questionsJson) {
    try {
      const parsed = JSON.parse(room.questionsJson) as RoomQuestion[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q, i) => ({
          ...q,
          index: q.index ?? i,
          taskNormalised: q.taskNormalised ?? q.taskRaw,
        }));
      }
    } catch {
      // fall through to single-question fallback
    }
  }

  return [
    {
      index: 0,
      taskRaw: room.taskRaw,
      taskNormalised: room.taskNormalised ?? room.taskRaw,
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
