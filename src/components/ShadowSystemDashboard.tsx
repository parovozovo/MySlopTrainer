"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RpgStatePayload,
  QuestRank,
  StatType,
  HabitDemon,
  Quest,
} from "@/types/rpg";
import { StatRadarSvg } from "@/components/StatRadarSvg";
import { PomodoroDungeon } from "@/components/PomodoroDungeon";
import { soundEngine } from "@/lib/sound";
import {
  Check,
  Plus,
  Trash2,
  Search,
  Timer,
  Split,
  Shield,
  AlertTriangle,
  Dices,
  Moon,
  UserCheck,
  Star,
  ShieldCheck,
  Heart,
  Zap,
  Coins,
  Flame,
  ListTodo,
  ShieldAlert,
  Award,
  BookCheck,
  PlusCircle,
  Crosshair,
  Repeat,
  CalendarCheck,
  UserCog,
  Clock,
  Target,
  FileText,
  Layers,
} from "lucide-react";

type ActiveTab = "QUESTS" | "DEMONS" | "DUNGEON" | "TAVERN" | "REFLECTION";

const DAILY_IDEAS: Array<{
  title: string;
  stat: StatType;
  xpReward: number;
  goldReward: number;
  hpPenalty: number;
}> = [
  {
    title: "Ранковий старт без соцмереж (перші 45 хв)",
    stat: "WIL",
    xpReward: 30,
    goldReward: 20,
    hpPenalty: 15,
  },
  {
    title: "Мінімум дві фокус-сесії глибокої роботи",
    stat: "INT",
    xpReward: 35,
    goldReward: 25,
    hpPenalty: 15,
  },
  {
    title: "Фізичне тренування або 8 000 кроків",
    stat: "STR",
    xpReward: 30,
    goldReward: 20,
    hpPenalty: 10,
  },
  {
    title: "Читання 20 сторінок фахової книги",
    stat: "INT",
    xpReward: 25,
    goldReward: 15,
    hpPenalty: 10,
  },
  {
    title: "Вечірнє планування трьох пріоритетів на завтра",
    stat: "DEX",
    xpReward: 25,
    goldReward: 15,
    hpPenalty: 10,
  },
  {
    title: "Відбій у фіксований час без екранів у ліжку",
    stat: "STR",
    xpReward: 30,
    goldReward: 20,
    hpPenalty: 15,
  },
];

const HABIT_IDEAS: Array<{
  title: string;
  type: "DEMON" | "POSITIVE";
  stat: StatType;
  xpValue: number;
  goldValue: number;
  hpPenalty: number;
}> = [
  {
    title: "Короткі відео та стрічки новин у робочий час",
    type: "DEMON",
    stat: "WIL",
    xpValue: 30,
    goldValue: 20,
    hpPenalty: 20,
  },
  {
    title: "Відкладання будильника вранці",
    type: "DEMON",
    stat: "WIL",
    xpValue: 25,
    goldValue: 15,
    hpPenalty: 15,
  },
  {
    title: "Солодке та хаотичні перекуси на стресі",
    type: "DEMON",
    stat: "STR",
    xpValue: 25,
    goldValue: 15,
    hpPenalty: 15,
  },
  {
    title: "Склянка чистої води та розминка спини",
    type: "POSITIVE",
    stat: "STR",
    xpValue: 15,
    goldValue: 10,
    hpPenalty: 0,
  },
  {
    title: "Короткий запис головної думки або підсумку зустрічі",
    type: "POSITIVE",
    stat: "INT",
    xpValue: 20,
    goldValue: 15,
    hpPenalty: 0,
  },
];

const TAVERN_IDEAS: Array<{
  title: string;
  description: string;
  cost: number;
}> = [
  {
    title: "Година гри або серіалу без почуття провини",
    description: "Чистий відпочинок після закриття запланованих квестів.",
    cost: 100,
  },
  {
    title: "Замовлення улюбленої вечері або кави з десертом",
    description: "Матеріальне підкріплення за складний робочий день.",
    cost: 220,
  },
  {
    title: "Покупка зі списку бажань",
    description: "Велика нагорода за стабільну серію без пропусків.",
    cost: 550,
  },
];

export function ShadowSystemDashboard() {
  const [data, setData] = useState<RpgStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("QUESTS");
  const [systemBanner, setSystemBanner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDungeonQuest, setSelectedDungeonQuest] = useState<string | undefined>(undefined);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Onboarding / Profile Form State
  const [obName, setObName] = useState("");
  const [obClass, setObClass] = useState("Стратег");
  const [obFocusStat, setObFocusStat] = useState<StatType>("INT");
  const [obMainGoal, setObMainGoal] = useState("");
  const [obBio, setObBio] = useState("");
  const [obFirstQuest, setObFirstQuest] = useState("");
  const [obFirstDemon, setObFirstDemon] = useState("");

  // New Quest Form State
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [newQuestRank, setNewQuestRank] = useState<QuestRank>("C");
  const [newQuestStat, setNewQuestStat] = useState<StatType>("INT");
  const [newQuestIsFrog, setNewQuestIsFrog] = useState(false);

  // New Daily Form State
  const [newDailyTitle, setNewDailyTitle] = useState("");
  const [newDailyStat, setNewDailyStat] = useState<StatType>("WIL");

  // New Habit/Demon Form State
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitType, setNewHabitType] = useState<"DEMON" | "POSITIVE">("DEMON");
  const [newHabitStat, setNewHabitStat] = useState<StatType>("WIL");

  // New Tavern Reward Form State
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardCost, setNewRewardCost] = useState("150");

  // Evening Reflection Form State
  const [moodScore, setMoodScore] = useState("4");
  const [energyScore, setEnergyScore] = useState("4");
  const [winsText, setWinsText] = useState("");
  const [blockersText, setBlockersText] = useState("");
  const [tomorrowFrogText, setTomorrowFrogText] = useState("");

  // Native <dialog> refs
  const sosDialogRef = useRef<HTMLDialogElement | null>(null);
  const stuckDialogRef = useRef<HTMLDialogElement | null>(null);
  const [activeSosDemon, setActiveSosDemon] = useState<HabitDemon | null>(null);
  const [sosSecondsLeft, setSosSecondsLeft] = useState(180);
  const [sosRunning, setSosRunning] = useState(false);
  const [rouletteQuest, setRouletteQuest] = useState<Quest | null>(null);

  const showNotification = (msg: string) => {
    setSystemBanner(msg);
    setTimeout(() => {
      setSystemBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const fetchRpgState = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rpg");
      if (!res.ok) {
        throw new Error("Не вдалося завантажити стан із локальної бази даних.");
      }
      const json: RpgStatePayload = await res.json();
      setData(json);
      if (json.profile) {
        setObName(json.profile.name || "");
        setObClass(json.profile.hunterClass || "Стратег");
        setObMainGoal(json.profile.mainGoal || "");
        setObBio(json.profile.bio || "");
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "Помилка з'єднання з базою даних."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRpgState();
  }, []);

  // Fallback for browsers without native <dialog closedby="any"> support
  useEffect(() => {
    const dialogs = [sosDialogRef.current, stuckDialogRef.current].filter(
      Boolean
    ) as HTMLDialogElement[];

    const handlers = dialogs.map((dialog) => {
      const handler = (event: MouseEvent) => {
        if ("closedBy" in HTMLDialogElement.prototype) return;
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener("click", handler);
      return { dialog, handler };
    });

    return () => {
      handlers.forEach(({ dialog, handler }) =>
        dialog.removeEventListener("click", handler)
      );
    };
  }, [data]);

  useEffect(() => {
    if (!sosRunning) return;
    const timer = setInterval(() => {
      setSosSecondsLeft((prev) => {
        if (prev <= 1) {
          setSosRunning(false);
          soundEngine.playLevelUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sosRunning]);

  const dispatchAction = async (
    action: string,
    payload: Record<string, unknown> = {},
    bannerMsg?: string
  ) => {
    const prevLevel = data?.profile.level ?? 1;
    const res = await fetch("/api/rpg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    if (res.ok) {
      const updated: RpgStatePayload = await res.json();
      setData(updated);
      if (updated.profile.level > prevLevel) {
        soundEngine.playLevelUp();
        showNotification(
          `Новий рівень ${updated.profile.level}. Здоров'я відновлено, нараховано +2 очки характеристик.`
        );
      } else if (bannerMsg) {
        showNotification(bannerMsg);
      }
    }
  };

  const handleOpenStuckProtocol = () => {
    if (!data) return;
    soundEngine.playClick();
    const uncompleted = data.quests.filter((q) => !q.completed);
    const chosen =
      uncompleted.find((q) => q.rank === "E" || q.rank === "D") ||
      uncompleted[0] ||
      null;
    setRouletteQuest(chosen);
    stuckDialogRef.current?.showModal();
  };

  const handleOpenSosModal = (demon: HabitDemon) => {
    soundEngine.playClick();
    setActiveSosDemon(demon);
    setSosSecondsLeft(180);
    setSosRunning(true);
    sosDialogRef.current?.showModal();
  };

  const handleCompleteSosChallenge = async () => {
    if (!activeSosDemon) return;
    soundEngine.playQuestComplete();
    setSosRunning(false);
    sosDialogRef.current?.close();
    await dispatchAction(
      "RESIST_URGE",
      { id: activeSosDemon.id },
      `Тягу подолано: +${activeSosDemon.xpValue + 10} XP, +${
        activeSosDemon.goldValue + 5
      } золота та +1 до Волі.`
    );
  };

  if (loading) {
    return (
      <main className="app-container py-16">
        <div className="well max-w-xl">
          <h1>Завантаження реєстру</h1>
          <p className="meta-text mt-2">
            Зчитування профілю та активних записів із локальної бази SQLite…
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg || !data) {
    return (
      <main className="app-container py-16">
        <div className="well max-w-xl">
          <h1>Збій читання бази даних</h1>
          <p className="meta-text mt-2">
            {errorMsg || "Не вдалося отримати дані профілю."}
          </p>
          <button
            type="button"
            onClick={fetchRpgState}
            className="btn btn--primary mt-6"
          >
            Повторити запит
          </button>
        </div>
      </main>
    );
  }

  const { profile, quests, dailies, habits, focusSessions, tavernItems, reflections } = data;

  if (!profile.onboarded || isEditingProfile) {
    return (
      <main className="app-container py-12">
        <div className="mx-auto max-w-2xl">
          <div className="well">
            <div className="panel-head">
              <div className="panel-title-group">
                <ShieldCheck className="icon-accent h-5 w-5" aria-hidden={true} />
                <h1>
                  {profile.onboarded
                    ? "Налаштування особистого профілю"
                    : "Ініціалізація профілю"}
                </h1>
              </div>
            </div>
            <p className="meta-text">
              Заповни короткі відомості про себе, свою головну ціль та фокус. Дані зберігаються локально у твоїй базі SQLite без демо-контенту.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!obName.trim()) return;
                soundEngine.playQuestComplete();
                if (!profile.onboarded) {
                  await dispatchAction(
                    "COMPLETE_ONBOARDING",
                    {
                      name: obName.trim(),
                      hunterClass: obClass.trim(),
                      focusStat: obFocusStat,
                      mainGoal: obMainGoal.trim(),
                      bio: obBio.trim(),
                      firstQuest: obFirstQuest.trim(),
                      firstDemon: obFirstDemon.trim(),
                    },
                    "Профіль створено. Тепер ти можеш формувати власну систему."
                  );
                } else {
                  await dispatchAction(
                    "UPDATE_PROFILE",
                    {
                      name: obName.trim(),
                      hunterClass: obClass.trim(),
                      mainGoal: obMainGoal.trim(),
                      bio: obBio.trim(),
                    },
                    "Дані профілю оновлено."
                  );
                  setIsEditingProfile(false);
                }
              }}
              className="mt-6 space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ob-name" className="label-text">
                    Ім&apos;я або позивний *
                  </label>
                  <input
                    id="ob-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={obName}
                    onChange={(e) => setObName(e.target.value)}
                    placeholder="Наприклад: Олександр"
                    className="field"
                  />
                </div>

                <div>
                  <label htmlFor="ob-class" className="label-text">
                    Твоя роль або спеціалізація
                  </label>
                  <input
                    id="ob-class"
                    name="hunterClass"
                    type="text"
                    value={obClass}
                    onChange={(e) => setObClass(e.target.value)}
                    placeholder="Інженер, Стратег, Розробник, Атлет…"
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ob-goal" className="label-text">
                  Головна ціль на найближчі 30 днів *
                </label>
                <input
                  id="ob-goal"
                  name="mainGoal"
                  type="text"
                  required
                  value={obMainGoal}
                  onChange={(e) => setObMainGoal(e.target.value)}
                  placeholder="Наприклад: Запустити власний проект і налагодити режим сну"
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="ob-bio" className="label-text">
                  Про себе та особисті правила (що для тебе найважливіше)
                </label>
                <textarea
                  id="ob-bio"
                  name="bio"
                  rows={3}
                  value={obBio}
                  onChange={(e) => setObBio(e.target.value)}
                  placeholder="Наприклад: Працюю глибокими блоками зранку, після 21:00 відкладаю телефон…"
                  className="textarea-field"
                />
              </div>

              {!profile.onboarded && (
                <>
                  <fieldset>
                    <legend className="label-text">
                      Пріоритетна характеристика старту (+3 бонусні очки)
                    </legend>
                    <div className="segmented-grid-5">
                      {(
                        [
                          { key: "INT", label: "INT" },
                          { key: "WIL", label: "WIL" },
                          { key: "STR", label: "STR" },
                          { key: "DEX", label: "DEX" },
                          { key: "CHA", label: "CHA" },
                        ] as Array<{ key: StatType; label: string }>
                      ).map((item) => (
                        <label key={item.key} className="segmented-choice">
                          <input
                            type="radio"
                            name="focusStat"
                            value={item.key}
                            checked={obFocusStat === item.key}
                            onChange={() => setObFocusStat(item.key)}
                            className="visually-hidden"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ob-first-quest" className="label-text">
                        Перша головна задача на сьогодні (необов&apos;язково)
                      </label>
                      <input
                        id="ob-first-quest"
                        name="firstQuest"
                        type="text"
                        value={obFirstQuest}
                        onChange={(e) => setObFirstQuest(e.target.value)}
                        placeholder="Можна залишити порожнім і додати пізніше"
                        className="field"
                      />
                    </div>

                    <div>
                      <label htmlFor="ob-first-demon" className="label-text">
                        Головна погана звичка для контролю (необов&apos;язково)
                      </label>
                      <input
                        id="ob-first-demon"
                        name="firstDemon"
                        type="text"
                        value={obFirstDemon}
                        onChange={(e) => setObFirstDemon(e.target.value)}
                        placeholder="Наприклад: Стрічка новин під час роботи"
                        className="field"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" className="btn btn--primary">
                  <UserCheck className="h-4 w-4" aria-hidden={true} />
                  <span>
                    {profile.onboarded ? "Зберегти зміни" : "Зберегти профіль і відкрити реєстр"}
                  </span>
                </button>
                {profile.onboarded && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="btn btn--secondary"
                  >
                    Повернутися до задач
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const hpRatio = Math.min(1, Math.max(0, profile.hp / profile.maxHp));
  const xpRatio = Math.min(1, Math.max(0, profile.xp / profile.xpToNextLevel));

  const filteredQuests = quests.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shadowDemons = habits.filter((h) => h.type === "DEMON");
  const positiveHabits = habits.filter((h) => h.type === "POSITIVE");

  const availableDailyIdeas = DAILY_IDEAS.filter(
    (idea) => !dailies.some((d) => d.title.toLowerCase() === idea.title.toLowerCase())
  );
  const availableHabitIdeas = HABIT_IDEAS.filter(
    (idea) => !habits.some((h) => h.title.toLowerCase() === idea.title.toLowerCase())
  );
  const availableTavernIdeas = TAVERN_IDEAS.filter(
    (idea) => !tavernItems.some((t) => t.title.toLowerCase() === idea.title.toLowerCase())
  );

  return (
    <div>
      {systemBanner && (
        <div role="status" aria-live="polite" className="toast-bar">
          {systemBanner}
        </div>
      )}

      {/* Top App Shell Header */}
      <header className="shell-header">
        <div className="app-container py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="icon-accent mt-1 h-6 w-6" aria-hidden={true} />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1>{profile.name}</h1>
                  <span className="tag-chip tag-chip--amber">
                    {profile.hunterClass} / Рівень {profile.level}
                  </span>
                </div>
                {profile.mainGoal && (
                  <p className="meta-text mt-1">Головна ціль: {profile.mainGoal}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenStuckProtocol}
                className="btn btn--secondary"
              >
                <Dices className="icon-accent h-4 w-4" aria-hidden={true} />
                <span>Правило 5 хвилин</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatchAction(
                    "NEW_DAY_RESET",
                    {},
                    "Нова доба: щоденні ритуали оновлено, лічильник днів без зривів збільшено."
                  )
                }
                className="btn btn--subtle"
              >
                <Moon className="h-3.5 w-3.5" aria-hidden={true} />
                <span>Нова доба</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="btn btn--subtle"
              >
                <UserCog className="h-3.5 w-3.5" aria-hidden={true} />
                <span>Профіль</span>
              </button>
            </div>
          </div>

          {/* Core Figures Strip */}
          <div className="stat-strip mt-5">
            <div className="stat-cell">
              <div className="flex items-center justify-between">
                <span className="small-meta flex items-center gap-1.5">
                  <Heart className="icon-accent h-3.5 w-3.5" aria-hidden={true} />
                  <span>Здоров&apos;я (HP)</span>
                </span>
                <span className="measured">
                  {profile.hp} / {profile.maxHp}
                </span>
              </div>
              <div className="meter mt-2.5">
                <span style={{ transform: `scaleX(${hpRatio})` }} />
              </div>
            </div>

            <div className="stat-cell">
              <div className="flex items-center justify-between">
                <span className="small-meta flex items-center gap-1.5">
                  <Zap className="icon-accent h-3.5 w-3.5" aria-hidden={true} />
                  <span>Досвід (XP)</span>
                </span>
                <span className="measured">
                  {profile.xp} / {profile.xpToNextLevel}
                </span>
              </div>
              <div className="meter meter--muted mt-2.5">
                <span style={{ transform: `scaleX(${xpRatio})` }} />
              </div>
            </div>

            <div className="stat-cell flex items-center justify-between">
              <div>
                <span className="small-meta flex items-center gap-1.5">
                  <Coins className="icon-accent h-3.5 w-3.5" aria-hidden={true} />
                  <span>Баланс золота</span>
                </span>
                <div className="reading mt-1">{profile.gold} G</div>
              </div>
            </div>

            <div className="stat-cell flex items-center justify-between">
              <div>
                <span className="small-meta flex items-center gap-1.5">
                  <Flame className="icon-accent h-3.5 w-3.5" aria-hidden={true} />
                  <span>Серія (щитів: {profile.freezeShields})</span>
                </span>
                <div className="reading mt-1">{profile.streakDays} дн.</div>
              </div>
            </div>
          </div>

          {/* Navigation Tab Strip */}
          <nav aria-label="Розділи робочого простору" className="tab-strip">
            {[
              {
                id: "QUESTS",
                label: `Квести та щоденні ритуали (${quests.filter((q) => !q.completed).length})`,
                icon: ListTodo,
              },
              {
                id: "DEMONS",
                label: `Звички та самоконтроль (${habits.length})`,
                icon: ShieldAlert,
              },
              {
                id: "DUNGEON",
                label: "Фокус-таймер (Pomodoro)",
                icon: Timer,
              },
              {
                id: "TAVERN",
                label: "Таверна нагород",
                icon: Award,
              },
              {
                id: "REFLECTION",
                label: "Вечірній підсумок",
                icon: BookCheck,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveTab(tab.id as ActiveTab);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className="tab-btn"
                >
                  <Icon className="h-4 w-4" aria-hidden={true} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Three-Column Workbench Layout */}
      <div className="app-container shell-layout">
        {/* Column 1: Profile & Stats */}
        <div className="space-y-6">
          <StatRadarSvg
            profile={profile}
            onAllocateStat={(stat) => {
              soundEngine.playQuestComplete();
              dispatchAction(
                "ALLOCATE_STAT",
                { stat },
                `Характеристику ${stat} збільшено на 1.`
              );
            }}
          />

          <section aria-labelledby="hunter-summary-heading" className="well">
            <div className="panel-head">
              <div className="panel-title-group">
                <FileText className="icon-accent h-4 w-4" aria-hidden={true} />
                <h2 id="hunter-summary-heading">Особисте досьє</h2>
              </div>
            </div>
            {profile.bio ? (
              <p className="meta-text">{profile.bio}</p>
            ) : (
              <p className="small-meta">
                Принципи роботи не вказано. Натисни «Профіль» у верхній панелі, щоб доповнити.
              </p>
            )}
            <dl className="rule-list mt-4">
              <div className="rule-row flex items-center justify-between">
                <dt className="small-meta flex items-center gap-2">
                  <Clock className="icon-muted h-3.5 w-3.5" aria-hidden={true} />
                  <span>Час у фокусі</span>
                </dt>
                <dd className="measured">{profile.focusMinutesTotal} хв</dd>
              </div>
              <div className="rule-row flex items-center justify-between">
                <dt className="small-meta flex items-center gap-2">
                  <Target className="icon-muted h-3.5 w-3.5" aria-hidden={true} />
                  <span>Головних задач закрито</span>
                </dt>
                <dd className="measured">{profile.bountiesSlain}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Column 2: Main Active Workspace */}
        <main className="space-y-6">
          {activeTab === "QUESTS" && (
            <>
              {/* Create Quest Form */}
              <section aria-labelledby="new-quest-heading" className="well">
                <div className="panel-head">
                  <div className="panel-title-group">
                    <PlusCircle className="icon-accent h-4 w-4" aria-hidden={true} />
                    <h2 id="new-quest-heading">Новий квест</h2>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newQuestTitle.trim()) return;
                    soundEngine.playClick();
                    dispatchAction(
                      "CREATE_QUEST",
                      {
                        title: newQuestTitle.trim(),
                        description: newQuestDesc.trim(),
                        rank: newQuestRank,
                        stat: newQuestStat,
                        isFrog: newQuestIsFrog,
                      },
                      `Додано квест рангу ${newQuestRank}.`
                    );
                    setNewQuestTitle("");
                    setNewQuestDesc("");
                    setNewQuestIsFrog(false);
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="quest-title-input" className="label-text">
                        Назва задачі *
                      </label>
                      <input
                        id="quest-title-input"
                        name="title"
                        type="text"
                        required
                        value={newQuestTitle}
                        onChange={(e) => setNewQuestTitle(e.target.value)}
                        placeholder="Що потрібно зробити?"
                        className="field"
                      />
                    </div>
                    <div>
                      <label htmlFor="quest-desc-input" className="label-text">
                        Критерій завершення (необов&apos;язково)
                      </label>
                      <input
                        id="quest-desc-input"
                        name="description"
                        type="text"
                        value={newQuestDesc}
                        onChange={(e) => setNewQuestDesc(e.target.value)}
                        placeholder="Коротке уточнення результату"
                        className="field"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="quest-rank-select" className="label-text">
                        Ранг складності
                      </label>
                      <select
                        id="quest-rank-select"
                        name="rank"
                        value={newQuestRank}
                        onChange={(e) => setNewQuestRank(e.target.value as QuestRank)}
                        className="select-field"
                      >
                        <option value="E">Ранг E (10 хв, +15 XP)</option>
                        <option value="D">Ранг D (20 хв, +25 XP)</option>
                        <option value="C">Ранг C (30 хв, +45 XP)</option>
                        <option value="B">Ранг B (45 хв, +70 XP)</option>
                        <option value="A">Ранг A (60 хв, +110 XP)</option>
                        <option value="S">Ранг S (Проект, +180 XP)</option>
                      </select>
                    </div>

                    <fieldset>
                      <legend className="label-text">Пов&apos;язана характеристика</legend>
                      <div className="segmented-grid-5">
                        {(["INT", "STR", "DEX", "WIL", "CHA"] as StatType[]).map((st) => (
                          <label key={st} className="segmented-choice">
                            <input
                              type="radio"
                              name="questStat"
                              value={st}
                              checked={newQuestStat === st}
                              onChange={() => setNewQuestStat(st)}
                              className="visually-hidden"
                            />
                            <span>{st}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newQuestIsFrog}
                        onChange={(e) => setNewQuestIsFrog(e.target.checked)}
                      />
                      <span>Позначити як головну задачу дня (подвійний досвід та золото)</span>
                    </label>
                    <button type="submit" className="btn btn--primary">
                      <Plus className="h-4 w-4" aria-hidden={true} />
                      <span>Додати квест</span>
                    </button>
                  </div>
                </form>
              </section>

              {/* Quests Ledger */}
              <section aria-labelledby="active-quests-heading" className="well">
                <div className="panel-head">
                  <div className="panel-title-group">
                    <Crosshair className="icon-accent h-4 w-4" aria-hidden={true} />
                    <h2 id="active-quests-heading">Активні квести</h2>
                  </div>

                  {quests.length > 0 && (
                    <search>
                      <div className="flex items-center gap-2">
                        <Search className="icon-muted h-4 w-4" aria-hidden={true} />
                        <label htmlFor="search-quests-input" className="visually-hidden">
                          Фільтр квестів
                        </label>
                        <input
                          id="search-quests-input"
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Пошук за назвою…"
                          className="field"
                        />
                      </div>
                    </search>
                  )}
                </div>

                {filteredQuests.length === 0 ? (
                  <p className="meta-text">
                    Список квестів порожній. Додай своє перше завдання у формі вище, щоб почати заробляти досвід і золото.
                  </p>
                ) : (
                  <ul className="rule-list">
                    {filteredQuests.map((quest) => (
                      <li
                        key={quest.id}
                        className={`rule-row ${quest.isFrog && !quest.completed ? "rule-row--active" : ""}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playQuestComplete();
                                dispatchAction(
                                  "TOGGLE_QUEST",
                                  { id: quest.id },
                                  !quest.completed
                                    ? `Квест виконано: +${
                                        quest.xpReward * (quest.isFrog ? 2 : 1)
                                      } XP, +${quest.goldReward * (quest.isFrog ? 2 : 1)} золота.`
                                    : undefined
                                );
                              }}
                              aria-label={
                                quest.completed
                                  ? `Повернути квест ${quest.title} в роботу`
                                  : `Позначити квест ${quest.title} виконаним`
                              }
                              className="btn btn--subtle mt-0.5"
                            >
                              <Check className="h-4 w-4" aria-hidden={true} />
                            </button>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={quest.completed ? "line-through opacity-60" : ""}>
                                  {quest.title}
                                </h3>
                                <span className="tag-chip">
                                  Ранг {quest.rank} / {quest.stat}
                                </span>
                                {quest.isFrog && (
                                  <span className="tag-chip tag-chip--amber">
                                    Головна задача (x2)
                                  </span>
                                )}
                              </div>
                              {quest.description && (
                                <p className="small-meta mt-1">{quest.description}</p>
                              )}
                              <p className="measured mt-1">
                                +{quest.xpReward * (quest.isFrog ? 2 : 1)} XP / +
                                {quest.goldReward * (quest.isFrog ? 2 : 1)} G
                              </p>
                            </div>
                          </div>

                          {!quest.completed && (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playClick();
                                  setSelectedDungeonQuest(quest.title);
                                  setActiveTab("DUNGEON");
                                }}
                                className="btn btn--subtle"
                              >
                                <Timer className="h-3.5 w-3.5" aria-hidden={true} />
                                <span>У фокус</span>
                              </button>

                              {quest.subquests.length === 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playClick();
                                    dispatchAction(
                                      "SPLIT_QUEST",
                                      { id: quest.id },
                                      "Задачу розкладено на 4 послідовні підкроки."
                                    );
                                  }}
                                  className="btn btn--subtle"
                                >
                                  <Split className="h-3.5 w-3.5" aria-hidden={true} />
                                  <span>Розбити на кроки</span>
                                </button>
                              )}

                              {!quest.isFrog && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    dispatchAction(
                                      "SET_FROG",
                                      { id: quest.id },
                                      "Задачу призначено головним пріоритетом дня (x2 нагорода)."
                                    )
                                  }
                                  title="Зробити головною задачею дня"
                                  className="btn btn--subtle"
                                >
                                  <Star className="h-3.5 w-3.5" aria-hidden={true} />
                                  <span>Головна</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => dispatchAction("DELETE_QUEST", { id: quest.id })}
                                aria-label={`Видалити квест ${quest.title}`}
                                className="btn btn--subtle"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden={true} />
                              </button>
                            </div>
                          )}
                        </div>

                        {quest.subquests && quest.subquests.length > 0 && (
                          <ul className="mt-3 space-y-1.5 pl-10">
                            {quest.subquests.map((sq) => (
                              <li key={sq.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playClick();
                                    dispatchAction(
                                      "TOGGLE_SUBQUEST",
                                      { questId: quest.id, subquestId: sq.id },
                                      !sq.done ? "+8 XP та +5 золота за підкрок." : undefined
                                    );
                                  }}
                                  className="flex items-center gap-2 text-left text-sm"
                                >
                                  <Check
                                    className={`h-3.5 w-3.5 ${sq.done ? "opacity-100" : "opacity-30"}`}
                                    aria-hidden={true}
                                  />
                                  <span className={sq.done ? "line-through opacity-50" : ""}>
                                    {sq.title}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Daily Rituals Ledger */}
              <section aria-labelledby="daily-rituals-heading" className="well">
                <div className="panel-head">
                  <div className="panel-title-group">
                    <Repeat className="icon-accent h-4 w-4" aria-hidden={true} />
                    <h2 id="daily-rituals-heading">Щоденні ритуали</h2>
                  </div>
                </div>
                <p className="small-meta">
                  Регулярні дії, що формують дисципліну. Можеш вписати власний ритуал нижче або обрати готову ідею в правій колонці.
                </p>

                {dailies.length === 0 ? (
                  <p className="meta-text mt-4">
                    У тебе ще немає щоденних ритуалів. Додай власний нижче або натисни «Додати» біля шаблонів праворуч.
                  </p>
                ) : (
                  <ul className="rule-list mt-4">
                    {dailies.map((d) => (
                      <li
                        key={d.id}
                        className="rule-row flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playQuestComplete();
                              dispatchAction(
                                "TOGGLE_DAILY",
                                { id: d.id },
                                !d.completedToday
                                  ? `Ритуал виконано. Серія: ${d.streak + 1} дн.`
                                  : undefined
                              );
                            }}
                            aria-label={`Позначити ритуал ${d.title}`}
                            className="btn btn--subtle"
                          >
                            <Check className="h-4 w-4" aria-hidden={true} />
                          </button>
                          <div>
                            <h3 className={d.completedToday ? "line-through opacity-60" : ""}>
                              {d.title}
                            </h3>
                            <p className="small-meta mt-0.5">
                              Стат {d.stat} / серія {d.streak} дн. / +{d.xpReward} XP (штраф -{d.hpPenalty} HP)
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => dispatchAction("DELETE_DAILY", { id: d.id })}
                          aria-label={`Видалити ритуал ${d.title}`}
                          className="btn btn--subtle"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden={true} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newDailyTitle.trim()) return;
                    dispatchAction(
                      "CREATE_DAILY",
                      { title: newDailyTitle.trim(), stat: newDailyStat },
                      "Щоденний ритуал додано."
                    );
                    setNewDailyTitle("");
                  }}
                  className="inline-add-bar mt-5 pt-4"
                >
                  <div>
                    <label htmlFor="new-daily-input" className="visually-hidden">
                      Назва щоденного ритуалу
                    </label>
                    <input
                      id="new-daily-input"
                      type="text"
                      required
                      value={newDailyTitle}
                      onChange={(e) => setNewDailyTitle(e.target.value)}
                      placeholder="Новий щоденний ритуал…"
                      className="field"
                    />
                  </div>
                  <select
                    aria-label="Характеристика ритуалу"
                    value={newDailyStat}
                    onChange={(e) => setNewDailyStat(e.target.value as StatType)}
                    className="select-field"
                  >
                    <option value="WIL">WIL</option>
                    <option value="STR">STR</option>
                    <option value="INT">INT</option>
                    <option value="DEX">DEX</option>
                    <option value="CHA">CHA</option>
                  </select>
                  <button type="submit" className="btn btn--secondary">
                    <Plus className="h-4 w-4" aria-hidden={true} />
                    <span>Додати</span>
                  </button>
                </form>
              </section>
            </>
          )}

          {activeTab === "DEMONS" && (
            <div className="space-y-6">
              <section aria-labelledby="shadow-demons-heading" className="well">
                <div className="panel-head">
                  <div className="panel-title-group">
                    <ShieldAlert className="icon-accent h-4 w-4" aria-hidden={true} />
                    <h2 id="shadow-demons-heading">Контроль шкідливих звичок</h2>
                  </div>
                </div>
                <p className="small-meta">
                  Коли виникає гостре бажання зірватися, запусти 3-хвилинний протокол опору й отримай досвід за витримку.
                </p>

                {shadowDemons.length === 0 ? (
                  <p className="meta-text mt-4">
                    Жодної шкідливої звички ще не додано. Впиши її нижче або додай із готових ідей праворуч.
                  </p>
                ) : (
                  <ul className="rule-list mt-4">
                    {shadowDemons.map((demon) => (
                      <li
                        key={demon.id}
                        className="rule-row flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <h3>{demon.title}</h3>
                          <p className="small-meta mt-0.5">
                            Чистих днів: {demon.cleanDays} / відбито імпульсів: {demon.urgesResisted} / штраф при зриві: -{demon.hpPenalty} HP
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenSosModal(demon)}
                            className="btn btn--primary"
                          >
                            <Shield className="h-4 w-4" aria-hidden={true} />
                            <span>Відбити тягу (+{demon.xpValue + 10} XP)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playDamage();
                              dispatchAction(
                                "RELAPSE_DEMON",
                                { id: demon.id },
                                `Зафіксовано зрив (-${demon.hpPenalty} HP). У списку квестів створено задачу спокути.`
                              );
                            }}
                            className="btn btn--subtle"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden={true} />
                            <span>Зрив</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => dispatchAction("DELETE_HABIT", { id: demon.id })}
                            aria-label={`Видалити запис ${demon.title}`}
                            className="btn btn--subtle"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden={true} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="positive-habits-heading" className="well">
                <div className="panel-head">
                  <div className="panel-title-group">
                    <Layers className="icon-accent h-4 w-4" aria-hidden={true} />
                    <h2 id="positive-habits-heading">Корисні мікро-звички</h2>
                  </div>
                </div>
                <p className="small-meta">
                  Швидкі корисні дії протягом дня, що додають досвід та відновлюють +3 HP.
                </p>

                {positiveHabits.length === 0 ? (
                  <p className="meta-text mt-4">
                    Додай власні корисні дії у формі нижче або скористайся панеллю ідей праворуч.
                  </p>
                ) : (
                  <ul className="rule-list mt-4">
                    {positiveHabits.map((h) => (
                      <li
                        key={h.id}
                        className="rule-row flex items-center justify-between gap-4"
                      >
                        <div>
                          <h3>{h.title}</h3>
                          <p className="small-meta mt-0.5">
                            Стат {h.stat} / виконано {h.urgesResisted} р. / +{h.xpValue} XP та +{h.goldValue} G
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playQuestComplete();
                              dispatchAction(
                                "TRIGGER_POSITIVE_HABIT",
                                { id: h.id },
                                `Корисна дія: +${h.xpValue} XP, +${h.goldValue} золота, +3 HP.`
                              );
                            }}
                            className="btn btn--secondary"
                          >
                            <Plus className="h-4 w-4" aria-hidden={true} />
                            <span>Виконано</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => dispatchAction("DELETE_HABIT", { id: h.id })}
                            aria-label={`Видалити звичку ${h.title}`}
                            className="btn btn--subtle"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden={true} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newHabitTitle.trim()) return;
                    dispatchAction(
                      "CREATE_HABIT",
                      {
                        title: newHabitTitle.trim(),
                        type: newHabitType,
                        stat: newHabitStat,
                      },
                      "Запис додано до списку звичок."
                    );
                    setNewHabitTitle("");
                  }}
                  className="inline-habit-bar mt-5 pt-4"
                >
                  <div>
                    <label htmlFor="new-habit-title" className="visually-hidden">
                      Назва звички
                    </label>
                    <input
                      id="new-habit-title"
                      type="text"
                      required
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      placeholder="Назва шкідливої або корисної звички…"
                      className="field"
                    />
                  </div>
                  <select
                    aria-label="Категорія звички"
                    value={newHabitType}
                    onChange={(e) => setNewHabitType(e.target.value as "DEMON" | "POSITIVE")}
                    className="select-field"
                  >
                    <option value="DEMON">Шкідлива звичка</option>
                    <option value="POSITIVE">Корисна дія</option>
                  </select>
                  <select
                    aria-label="Характеристика"
                    value={newHabitStat}
                    onChange={(e) => setNewHabitStat(e.target.value as StatType)}
                    className="select-field"
                  >
                    <option value="WIL">WIL</option>
                    <option value="STR">STR</option>
                    <option value="INT">INT</option>
                  </select>
                  <button type="submit" className="btn btn--secondary">
                    <Plus className="h-4 w-4" aria-hidden={true} />
                    <span>Додати</span>
                  </button>
                </form>
              </section>
            </div>
          )}

          {activeTab === "DUNGEON" && (
            <PomodoroDungeon
              quests={quests}
              focusSessions={focusSessions}
              initialQuestTitle={selectedDungeonQuest}
              onCompleteSession={async (payload) => {
                await dispatchAction(
                  "COMPLETE_FOCUS_SESSION",
                  payload,
                  `Раунд завершено. Нараховано досвід та золото.`
                );
              }}
              onDesertSession={async (payload) => {
                await dispatchAction(
                  "DESERT_FOCUS_SESSION",
                  payload,
                  `Раунд перервано (-15 HP).`
                );
              }}
            />
          )}

          {activeTab === "TAVERN" && (
            <section aria-labelledby="tavern-heading" className="well">
              <div className="panel-head">
                <div className="panel-title-group">
                  <Award className="icon-accent h-4 w-4" aria-hidden={true} />
                  <h2 id="tavern-heading">Таверна нагород</h2>
                </div>
                <span className="reading">{profile.gold} G</span>
              </div>
              <p className="small-meta">
                Обмінюй зароблене золото на відновлення ресурсів або власні нагороди в реальному житті.
              </p>

              <ul className="rule-list mt-4">
                {tavernItems.map((item) => {
                  const canAfford = profile.gold >= item.cost;
                  return (
                    <li
                      key={item.id}
                      className="rule-row flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <h3>{item.title}</h3>
                        <p className="small-meta mt-0.5">
                          {item.description} (використано: {item.ownedCount})
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="reading">{item.cost} G</span>
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            soundEngine.playQuestComplete();
                            dispatchAction(
                              "BUY_TAVERN_ITEM",
                              { id: item.id },
                              `Придбано «${item.title}» за ${item.cost} золота.`
                            );
                          }}
                          className="btn btn--primary"
                        >
                          <span>Придбати</span>
                        </button>
                        {item.category === "REAL_REWARD" && (
                          <button
                            type="button"
                            onClick={() => dispatchAction("DELETE_TAVERN_ITEM", { id: item.id })}
                            aria-label={`Видалити нагороду ${item.title}`}
                            className="btn btn--subtle"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden={true} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newRewardTitle.trim()) return;
                  dispatchAction(
                    "CREATE_TAVERN_ITEM",
                    { title: newRewardTitle.trim(), cost: Number(newRewardCost) || 150 },
                    "Власну нагороду додано до таверни."
                  );
                  setNewRewardTitle("");
                }}
                className="inline-reward-bar mt-5 pt-4"
              >
                <div>
                  <label htmlFor="new-reward-title" className="visually-hidden">
                    Назва власної нагороди
                  </label>
                  <input
                    id="new-reward-title"
                    type="text"
                    required
                    value={newRewardTitle}
                    onChange={(e) => setNewRewardTitle(e.target.value)}
                    placeholder="Власна нагорода (наприклад: Вечір кіно або нова річ)…"
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="new-reward-cost" className="visually-hidden">
                    Вартість у золоті
                  </label>
                  <input
                    id="new-reward-cost"
                    type="text"
                    inputMode="numeric"
                    pattern="\d+"
                    value={newRewardCost}
                    onChange={(e) => setNewRewardCost(e.target.value)}
                    placeholder="Вартість"
                    className="field"
                  />
                </div>
                <button type="submit" className="btn btn--secondary">
                  <Plus className="h-4 w-4" aria-hidden={true} />
                  <span>Додати</span>
                </button>
              </form>
            </section>
          )}

          {activeTab === "REFLECTION" && (
            <div className="space-y-6">
              <section aria-labelledby="reflection-heading" className="well">
                <div className="panel-head">
                  <div className="panel-title-group">
                    <BookCheck className="icon-accent h-4 w-4" aria-hidden={true} />
                    <h2 id="reflection-heading">Вечірній чек-ін (+60 XP та +30 G)</h2>
                  </div>
                </div>
                <p className="small-meta">
                  Короткий розбір дня допомагає втримати фокус і одразу сформувати головну задачу на завтра.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!winsText.trim()) return;
                    soundEngine.playLevelUp();
                    dispatchAction(
                      "SUBMIT_REFLECTION",
                      {
                        moodScore: Number(moodScore),
                        energyScore: Number(energyScore),
                        wins: winsText.trim(),
                        blockers: blockersText.trim(),
                        tomorrowFrog: tomorrowFrogText.trim(),
                      },
                      "Підсумок дня збережено: +60 XP, +30 золота та +15 HP."
                    );
                    setWinsText("");
                    setBlockersText("");
                    setTomorrowFrogText("");
                  }}
                  className="mt-5 space-y-5"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <fieldset>
                      <legend className="label-text">Оцінка продуктивності дня (1–5)</legend>
                      <div className="segmented-grid-5">
                        {["1", "2", "3", "4", "5"].map((val) => (
                          <label key={val} className="segmented-choice">
                            <input
                              type="radio"
                              name="moodScore"
                              value={val}
                              checked={moodScore === val}
                              onChange={() => setMoodScore(val)}
                              className="visually-hidden"
                            />
                            <span>{val}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="label-text">Запас енергії (1–5)</legend>
                      <div className="segmented-grid-5">
                        {["1", "2", "3", "4", "5"].map((val) => (
                          <label key={val} className="segmented-choice">
                            <input
                              type="radio"
                              name="energyScore"
                              value={val}
                              checked={energyScore === val}
                              onChange={() => setEnergyScore(val)}
                              className="visually-hidden"
                            />
                            <span>{val}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <label htmlFor="wins-textarea" className="label-text">
                      Що вдалося зробити сьогодні *
                    </label>
                    <textarea
                      id="wins-textarea"
                      name="wins"
                      required
                      rows={2}
                      value={winsText}
                      onChange={(e) => setWinsText(e.target.value)}
                      placeholder="Зафіксуй конкретні виконані кроки…"
                      className="textarea-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="blockers-textarea" className="label-text">
                      Що відволікало або забирало сили
                    </label>
                    <textarea
                      id="blockers-textarea"
                      name="blockers"
                      rows={2}
                      value={blockersText}
                      onChange={(e) => setBlockersText(e.target.value)}
                      placeholder="Втома, зайві дзвінки, соцмережі…"
                      className="textarea-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="tomorrow-frog-input" className="label-text">
                      Головна задача на завтра (автоматично створить пріоритетний квест рангу A)
                    </label>
                    <input
                      id="tomorrow-frog-input"
                      name="tomorrowFrog"
                      type="text"
                      value={tomorrowFrogText}
                      onChange={(e) => setTomorrowFrogText(e.target.value)}
                      placeholder="Яка одна справа зробить завтрашній день успішним?"
                      className="field"
                    />
                  </div>

                  <button type="submit" className="btn btn--primary">
                    <Check className="h-4 w-4" aria-hidden={true} />
                    <span>Зберегти запис</span>
                  </button>
                </form>
              </section>

              <section aria-labelledby="reflection-history-heading" className="well">
                <div className="panel-head">
                  <div className="panel-title-group">
                    <FileText className="icon-accent h-4 w-4" aria-hidden={true} />
                    <h3 id="reflection-history-heading">Попередні записи</h3>
                  </div>
                </div>
                {reflections.length === 0 ? (
                  <p className="meta-text">
                    Записів рефлексії ще немає. Заповни свій перший вечірній підсумок вище.
                  </p>
                ) : (
                  <ul className="rule-list">
                    {reflections.map((log) => (
                      <li key={log.id} className="rule-row space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3>{log.dateLabel}</h3>
                          <span className="measured">
                            Оцінка {log.moodScore}/5, енергія {log.energyScore}/5 (+{log.xpEarned} XP)
                          </span>
                        </div>
                        <p className="meta-text">Перемоги: {log.wins}</p>
                        {log.blockers && (
                          <p className="small-meta">Перешкоди: {log.blockers}</p>
                        )}
                        {log.tomorrowFrog && (
                          <p className="small-meta">Пріоритет на наступний день: {log.tomorrowFrog}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </main>

        {/* Column 3: Quick-Add Ideas Rail */}
        <aside aria-labelledby="ideas-rail-heading" className="ideas-column space-y-6">
          <div className="well">
            <div className="panel-head">
              <div className="panel-title-group">
                <CalendarCheck className="icon-accent h-4 w-4" aria-hidden={true} />
                <h2 id="ideas-rail-heading">Каталог шаблонів</h2>
              </div>
            </div>
            <p className="small-meta">
              Готові ідеї для швидкого старту. Натисни «Додати», щоб перенести потрібний пункт у свій реєстр.
            </p>

            {/* Daily Ritual Templates */}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Repeat className="icon-muted h-3.5 w-3.5" aria-hidden={true} />
                <h3>Щоденні ритуали</h3>
              </div>
              {availableDailyIdeas.length === 0 ? (
                <p className="small-meta mt-2">Усі базові ритуали вже додано.</p>
              ) : (
                <ul className="rule-list mt-2">
                  {availableDailyIdeas.map((idea) => (
                    <li key={idea.title} className="idea-row">
                      <div>
                        <p className="text-sm">{idea.title}</p>
                        <span className="measured">
                          {idea.stat} / +{idea.xpReward} XP
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          dispatchAction(
                            "CREATE_DAILY",
                            idea,
                            `Ритуал «${idea.title}» додано.`
                          );
                        }}
                        className="btn btn--subtle"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden={true} />
                        <span>Додати</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Habit & Demon Templates */}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="icon-muted h-3.5 w-3.5" aria-hidden={true} />
                <h3>Звички та самоконтроль</h3>
              </div>
              {availableHabitIdeas.length === 0 ? (
                <p className="small-meta mt-2">Усі шаблони звичок уже додано.</p>
              ) : (
                <ul className="rule-list mt-2">
                  {availableHabitIdeas.map((idea) => (
                    <li key={idea.title} className="idea-row">
                      <div>
                        <p className="text-sm">{idea.title}</p>
                        <span className="small-meta">
                          {idea.type === "DEMON" ? "Шкідлива" : "Корисна"} ({idea.stat})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          dispatchAction(
                            "CREATE_HABIT",
                            idea,
                            `Додано до розділу звичок: «${idea.title}».`
                          );
                        }}
                        className="btn btn--subtle"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden={true} />
                        <span>Додати</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tavern Reward Templates */}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Award className="icon-muted h-3.5 w-3.5" aria-hidden={true} />
                <h3>Нагороди таверни</h3>
              </div>
              {availableTavernIdeas.length === 0 ? (
                <p className="small-meta mt-2">Усі базові нагороди вже додано.</p>
              ) : (
                <ul className="rule-list mt-2">
                  {availableTavernIdeas.map((idea) => (
                    <li key={idea.title} className="idea-row">
                      <div>
                        <p className="text-sm">{idea.title}</p>
                        <span className="measured">{idea.cost} G</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          dispatchAction(
                            "CREATE_TAVERN_ITEM",
                            idea,
                            `Нагороду «${idea.title}» додано в таверну.`
                          );
                        }}
                        className="btn btn--subtle"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden={true} />
                        <span>Додати</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL 1: SOS URGE SURFING DIALOG */}
      <dialog
        ref={sosDialogRef}
        {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby="sos-dialog-title"
        className="modal-sheet"
      >
        <div>
          <h2 id="sos-dialog-title">Протокол опору: {activeSosDemon?.title}</h2>
          <p className="meta-text mt-2">
            Гостра фаза імпульсивного бажання триває близько трьох хвилин. Перечекай цей час, зроби 10 глибоких вдихів або встань із-за столу.
          </p>

          <div className="well--recessed my-6">
            <div className="reading--hero">
              {Math.floor(sosSecondsLeft / 60)}:{String(sosSecondsLeft % 60).padStart(2, "0")}
            </div>
            <p className="small-meta mt-2">
              Вдих 4 секунди, затримка 4 секунди, повільний видих 6 секунд.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCompleteSosChallenge}
              className="btn btn--primary"
            >
              <Check className="h-4 w-4" aria-hidden={true} />
              <span>Тягу подолано</span>
            </button>
            <form method="dialog">
              <button
                type="submit"
                onClick={() => setSosRunning(false)}
                className="btn btn--secondary"
              >
                Закрити
              </button>
            </form>
          </div>
        </div>
      </dialog>

      {/* MODAL 2: ANTI-PROCRASTINATION 5-MINUTE RULE */}
      <dialog
        ref={stuckDialogRef}
        {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby="stuck-dialog-title"
        className="modal-sheet"
      >
        <div>
          <h2 id="stuck-dialog-title">Правило 5 хвилин</h2>
          <p className="meta-text mt-2">
            Коли важко почати, домовся із собою попрацювати лише п&apos;ять хвилин. Якщо після цього захочеш зупинитися, ти можеш завершити сесію без штрафу.
          </p>

          {rouletteQuest ? (
            <div className="well--recessed my-6">
              <h3>{rouletteQuest.title}</h3>
              <p className="small-meta mt-1">
                Рекомендована задача для старту (Ранг {rouletteQuest.rank}, +{rouletteQuest.xpReward} XP)
              </p>
            </div>
          ) : (
            <p className="meta-text my-6">
              Активних квестів наразі немає. Ти можеш запустити вільний 5-хвилинний раунд у таймері фокусу.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                stuckDialogRef.current?.close();
                if (rouletteQuest) {
                  setSelectedDungeonQuest(rouletteQuest.title);
                }
                setActiveTab("DUNGEON");
              }}
              className="btn btn--primary"
            >
              <Timer className="h-4 w-4" aria-hidden={true} />
              <span>Почати 5-хвилинний раунд</span>
            </button>
            <form method="dialog">
              <button type="submit" className="btn btn--secondary">
                Закрити
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
