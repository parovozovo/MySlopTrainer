"use client";

import React, { useState, useEffect } from "react";
import { FocusSession, Quest } from "@/types/rpg";
import { soundEngine } from "@/lib/sound";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Check,
  X,
  Timer,
  Crosshair,
  History,
} from "lucide-react";

interface PomodoroDungeonProps {
  quests: Quest[];
  focusSessions: FocusSession[];
  initialQuestTitle?: string;
  onCompleteSession: (payload: {
    questTitle: string;
    monsterName: string;
    minutes: number;
    overdriveMinutes: number;
  }) => Promise<void>;
  onDesertSession: (payload: {
    questTitle: string;
    monsterName: string;
    minutes: number;
  }) => Promise<void>;
}

const DUNGEON_PRESETS = [
  {
    id: "micro",
    label: "5 хв старт",
    minutes: 5,
    monster: "Інерція старту (Ранг E)",
    xpPreview: "+15 XP",
  },
  {
    id: "sprint",
    label: "15 хв спринт",
    minutes: 15,
    monster: "Поверхневий розфокус (Ранг C)",
    xpPreview: "+35 XP",
  },
  {
    id: "classic",
    label: "25 хв стандарт",
    minutes: 25,
    monster: "Вартовий прокрастинації (Ранг B)",
    xpPreview: "+55 XP",
  },
  {
    id: "deep",
    label: "50 хв занурення",
    minutes: 50,
    monster: "Архітектор хаосу (Ранг S)",
    xpPreview: "+110 XP",
  },
];

export function PomodoroDungeon({
  quests,
  focusSessions,
  initialQuestTitle,
  onCompleteSession,
  onDesertSession,
}: PomodoroDungeonProps) {
  const activeQuests = quests.filter((q) => !q.completed);
  const [selectedPreset, setSelectedPreset] = useState(DUNGEON_PRESETS[2]);
  const [targetQuestTitle, setTargetQuestTitle] = useState(
    initialQuestTitle || activeQuests[0]?.title || "Самостійна фокус-сесія"
  );
  const [secondsLeft, setSecondsLeft] = useState(DUNGEON_PRESETS[2].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isOverdrive, setIsOverdrive] = useState(false);
  const [overdriveSeconds, setOverdriveSeconds] = useState(0);
  const [ambientMode, setAmbientMode] = useState<"OFF" | "BROWN_NOISE" | "BINAURAL">("OFF");

  useEffect(() => {
    if (initialQuestTitle) {
      setTargetQuestTitle(initialQuestTitle);
    }
  }, [initialQuestTitle]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (!isOverdrive) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            soundEngine.playLevelUp();
            setIsOverdrive(true);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setOverdriveSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isOverdrive]);

  useEffect(() => {
    return () => {
      soundEngine.stopAmbient();
    };
  }, []);

  const totalSeconds = selectedPreset.minutes * 60;
  const monsterHpRatio = isOverdrive
    ? 0
    : Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const monsterHpPercent = Math.round(monsterHpRatio * 100);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSelectPreset = (preset: (typeof DUNGEON_PRESETS)[number]) => {
    if (isRunning) return;
    setSelectedPreset(preset);
    setSecondsLeft(preset.minutes * 60);
    setIsOverdrive(false);
    setOverdriveSeconds(0);
  };

  const handleAmbientChange = (mode: "OFF" | "BROWN_NOISE" | "BINAURAL") => {
    setAmbientMode(mode);
    soundEngine.toggleDungeonAmbient(mode);
  };

  const handleClaimVictory = async () => {
    setIsRunning(false);
    soundEngine.stopAmbient();
    setAmbientMode("OFF");
    soundEngine.playQuestComplete();

    const extraMins = Math.floor(overdriveSeconds / 60);
    await onCompleteSession({
      questTitle: targetQuestTitle,
      monsterName: selectedPreset.monster,
      minutes: selectedPreset.minutes,
      overdriveMinutes: extraMins,
    });

    setIsOverdrive(false);
    setOverdriveSeconds(0);
    setSecondsLeft(selectedPreset.minutes * 60);
  };

  const handleDesert = async () => {
    setIsRunning(false);
    soundEngine.stopAmbient();
    setAmbientMode("OFF");
    soundEngine.playDamage();
    await onDesertSession({
      questTitle: targetQuestTitle,
      monsterName: selectedPreset.monster,
      minutes: selectedPreset.minutes,
    });
    setIsOverdrive(false);
    setOverdriveSeconds(0);
    setSecondsLeft(selectedPreset.minutes * 60);
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="dungeon-arena-heading" className="well">
        <div className="panel-head">
          <div className="panel-title-group">
            <Timer className="icon-accent h-5 w-5" aria-hidden={true} />
            <div>
              <h2 id="dungeon-arena-heading">Фокус-сесія та стан потоку</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="small-meta">Аудіо-канал:</span>
            <button
              type="button"
              onClick={() => handleAmbientChange("OFF")}
              className={`btn btn--subtle ${ambientMode === "OFF" ? "btn--secondary" : ""}`}
            >
              <VolumeX className="h-3.5 w-3.5" aria-hidden={true} />
              <span>Тиша</span>
            </button>
            <button
              type="button"
              onClick={() => handleAmbientChange("BROWN_NOISE")}
              className={`btn btn--subtle ${ambientMode === "BROWN_NOISE" ? "btn--secondary" : ""}`}
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden={true} />
              <span>Низький шум</span>
            </button>
            <button
              type="button"
              onClick={() => handleAmbientChange("BINAURAL")}
              className={`btn btn--subtle ${ambientMode === "BINAURAL" ? "btn--secondary" : ""}`}
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden={true} />
              <span>14 Гц</span>
            </button>
          </div>
        </div>

        <p className="meta-text">
          Кожна хвилина роботи зменшує опір задачі. Після завершення таймера вмикається режим наднорми (x1.5 досвіду).
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DUNGEON_PRESETS.map((preset) => {
            const active = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isRunning}
                onClick={() => handleSelectPreset(preset)}
                className={`btn ${active ? "btn--primary" : "btn--secondary"} justify-between`}
              >
                <span>{preset.label}</span>
                <span className="measured">{preset.xpPreview}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <label htmlFor="dungeon-quest-select" className="label-text">
            Активна ціль раунду
          </label>
          <select
            id="dungeon-quest-select"
            value={targetQuestTitle}
            onChange={(e) => setTargetQuestTitle(e.target.value)}
            disabled={isRunning}
            className="select-field"
          >
            {activeQuests.map((q) => (
              <option key={q.id} value={q.title}>
                [Ранг {q.rank}] {q.title}
              </option>
            ))}
            <option value="Самостійна фокус-сесія без прив'язки до квесту">
              Самостійна фокус-сесія без прив&apos;язки до квесту
            </option>
          </select>
        </div>

        <div className="well--recessed mt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="icon-accent h-4 w-4" aria-hidden={true} />
              <h3>Ціль: {selectedPreset.monster}</h3>
            </div>
            <span className="measured">Опір: {monsterHpPercent}%</span>
          </div>

          <div className="meter mt-3">
            <span style={{ transform: `scaleX(${monsterHpRatio})` }} />
          </div>

          <div className="my-8">
            {!isOverdrive ? (
              <div>
                <div className="reading--hero">{formatTime(secondsLeft)}</div>
                <p className="meta-text mt-2">
                  Тримай увагу на одній задачі до завершення відліку.
                </p>
              </div>
            ) : (
              <div>
                <p className="meta-text">
                  Основний час вичерпано. Наднорма нараховує підвищений досвід і золото.
                </p>
                <div className="reading--hero mt-2">+{formatTime(overdriveSeconds)}</div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isRunning && !isOverdrive && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setIsRunning(true);
                }}
                className="btn btn--primary"
              >
                <Play className="h-4 w-4" aria-hidden={true} />
                <span>Почати раунд ({selectedPreset.minutes} хв)</span>
              </button>
            )}

            {isRunning && !isOverdrive && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRunning(false)}
                  className="btn btn--secondary"
                >
                  <Pause className="h-4 w-4" aria-hidden={true} />
                  <span>Пауза</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOverdrive(true);
                    setSecondsLeft(0);
                    soundEngine.playQuestComplete();
                  }}
                  className="btn btn--secondary"
                >
                  <Check className="h-4 w-4" aria-hidden={true} />
                  <span>Завершити достроково</span>
                </button>
                <button type="button" onClick={handleDesert} className="btn btn--subtle">
                  <X className="h-4 w-4" aria-hidden={true} />
                  <span>Перервати (-15 HP)</span>
                </button>
              </>
            )}

            {isOverdrive && (
              <>
                <button
                  type="button"
                  onClick={handleClaimVictory}
                  className="btn btn--primary"
                >
                  <Check className="h-4 w-4" aria-hidden={true} />
                  <span>Забрати нагороду</span>
                </button>
                {!isRunning ? (
                  <button
                    type="button"
                    onClick={() => setIsRunning(true)}
                    className="btn btn--secondary"
                  >
                    <Play className="h-4 w-4" aria-hidden={true} />
                    <span>Продовжити наднорму</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRunning(false)}
                    className="btn btn--secondary"
                  >
                    <Pause className="h-4 w-4" aria-hidden={true} />
                    <span>Призупинити наднорму</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="dungeon-history-heading" className="well">
        <div className="panel-head">
          <div className="panel-title-group">
            <History className="icon-accent h-4 w-4" aria-hidden={true} />
            <h3 id="dungeon-history-heading">Журнал проведених сесій</h3>
          </div>
        </div>
        {focusSessions.length === 0 ? (
          <p className="meta-text">
            Жодної фокус-сесії ще не записано. Обери тривалість вище та запусти свій перший раунд.
          </p>
        ) : (
          <ul className="rule-list">
            {focusSessions.map((s) => (
              <li key={s.id} className="rule-row flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <h3>{s.questTitle}</h3>
                  <p className="small-meta mt-0.5">
                    {s.monsterName} ({s.minutes} хв
                    {s.overdriveMinutes > 0 ? `, наднорма +${s.overdriveMinutes} хв` : ""})
                  </p>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="tag-chip">
                    {s.status === "VICTORY" ? "Завершено" : "Перервано"}
                  </span>
                  {s.status === "VICTORY" && (
                    <span className="measured">
                      +{s.xpEarned} XP / +{s.goldEarned} G
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
