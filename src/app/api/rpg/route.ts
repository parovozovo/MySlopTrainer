import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RANK_REWARDS: Record<string, { xp: number; gold: number; minutes: number }> = {
  E: { xp: 15, gold: 10, minutes: 10 },
  D: { xp: 25, gold: 15, minutes: 20 },
  C: { xp: 45, gold: 25, minutes: 30 },
  B: { xp: 70, gold: 45, minutes: 45 },
  A: { xp: 110, gold: 70, minutes: 60 },
  S: { xp: 180, gold: 120, minutes: 90 },
};

async function applyXpAndGold(
  xpDelta: number,
  goldDelta: number,
  statKey?: string,
  hpDelta = 0,
  bountyIncrement = 0,
  focusMinutesDelta = 0
) {
  const profile = await prisma.hunterProfile.findUnique({
    where: { id: "default-hunter" },
  });
  if (!profile) return null;

  let xp = Math.max(0, profile.xp + xpDelta);
  let level = profile.level;
  let xpToNextLevel = profile.xpToNextLevel;
  let maxHp = profile.maxHp;
  let hp = Math.min(maxHp, Math.max(1, profile.hp + hpDelta));
  let statPoints = profile.statPoints;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = Math.round(xpToNextLevel * 1.25);
    maxHp += 15;
    hp = maxHp;
    statPoints += 2;
  }

  const statUpdates: Record<string, number> = {};
  if (statKey) {
    const key = statKey.toUpperCase();
    if (key === "STR") statUpdates.str = profile.str + 1;
    if (key === "INT") statUpdates.intel = profile.intel + 1;
    if (key === "DEX") statUpdates.dex = profile.dex + 1;
    if (key === "WIL") statUpdates.wil = profile.wil + 1;
    if (key === "CHA") statUpdates.cha = profile.cha + 1;
  }

  const titleByLevel =
    level >= 10
      ? "Монарх залізної дисципліни"
      : level >= 5
      ? "Мисливець старшого рангу"
      : level >= 3
      ? "Пробуджений практик"
      : "Рекрут першого рангу";

  return prisma.hunterProfile.update({
    where: { id: "default-hunter" },
    data: {
      level,
      xp,
      xpToNextLevel,
      hp,
      maxHp,
      gold: Math.max(0, profile.gold + goldDelta),
      statPoints,
      title: titleByLevel,
      bountiesSlain: Math.max(0, profile.bountiesSlain + bountyIncrement),
      focusMinutesTotal: Math.max(0, profile.focusMinutesTotal + focusMinutesDelta),
      ...statUpdates,
    },
  });
}

async function ensureInitialized() {
  const existing = await prisma.hunterProfile.findUnique({
    where: { id: "default-hunter" },
  });
  if (existing) return;

  // Create blank profile with onboarded: false and NO demo tasks/habits
  await prisma.hunterProfile.create({
    data: {
      id: "default-hunter",
      onboarded: false,
      name: "",
      title: "Рекрут першого рангу",
      hunterClass: "Стратег",
      mainGoal: "",
      bio: "",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      streakDays: 0,
      freezeShields: 1,
      statPoints: 0,
      str: 10,
      intel: 10,
      dex: 10,
      wil: 10,
      cha: 10,
      focusMinutesTotal: 0,
      bountiesSlain: 0,
    },
  });

  // Only system mechanics items in Tavern (HP heal & Streak shield), no fake user rewards
  const tavernCount = await prisma.tavernItem.count();
  if (tavernCount === 0) {
    await prisma.tavernItem.createMany({
      data: [
        {
          title: "Відновлення здоров'я (+40 HP)",
          description: "Системний резерв для відновлення життєвих сил після зриву чи пропуску.",
          category: "CONSUMABLE",
          cost: 45,
          icon: "heal",
          effectType: "HEAL_HP",
          ownedCount: 0,
        },
        {
          title: "Заморозка стріку (+1 щит)",
          description: "Захищає щоденну серія від обнулення у разі хвороби чи форс-мажору.",
          category: "ARTIFACT",
          cost: 90,
          icon: "shield",
          effectType: "SHIELD",
          ownedCount: 0,
        },
      ],
    });
  }
}

async function getFullState() {
  await ensureInitialized();
  const [profile, questsRaw, dailies, habits, focusSessions, tavernItems, reflections] =
    await Promise.all([
      prisma.hunterProfile.findUnique({ where: { id: "default-hunter" } }),
      prisma.quest.findMany({
        orderBy: [{ completed: "asc" }, { isFrog: "desc" }, { createdAt: "desc" }],
      }),
      prisma.dailyRitual.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.habitDemon.findMany({ orderBy: { type: "asc" } }),
      prisma.focusSession.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
      prisma.tavernItem.findMany({ orderBy: { cost: "asc" } }),
      prisma.reflectionLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    ]);

  const quests = questsRaw.map((q) => {
    let parsedSubquests = [];
    try {
      parsedSubquests = JSON.parse(q.subquests || "[]");
    } catch {
      parsedSubquests = [];
    }
    return {
      ...q,
      subquests: parsedSubquests,
    };
  });

  return {
    profile,
    quests,
    dailies,
    habits,
    focusSessions,
    tavernItems,
    reflections,
  };
}

export async function GET() {
  try {
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("GET /api/rpg error:", error);
    return NextResponse.json({ error: "Failed to load RPG state" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case "COMPLETE_ONBOARDING": {
        const focusStat = (payload.focusStat || "INT") as string;
        const baseStats = {
          str: 10 + (focusStat === "STR" ? 3 : 0),
          intel: 10 + (focusStat === "INT" ? 3 : 0),
          dex: 10 + (focusStat === "DEX" ? 3 : 0),
          wil: 10 + (focusStat === "WIL" ? 3 : 0),
          cha: 10 + (focusStat === "CHA" ? 3 : 0),
        };

        await prisma.hunterProfile.update({
          where: { id: "default-hunter" },
          data: {
            onboarded: true,
            name: (payload.name || "Мисливець").trim(),
            hunterClass: (payload.hunterClass || "Стратег").trim(),
            mainGoal: (payload.mainGoal || "").trim(),
            bio: (payload.bio || "").trim(),
            ...baseStats,
          },
        });

        if (payload.firstQuest && String(payload.firstQuest).trim().length > 0) {
          await prisma.quest.create({
            data: {
              title: String(payload.firstQuest).trim(),
              description: "Перша ключова задача, визначена під час ініціалізації профілю.",
              rank: "B",
              stat: focusStat,
              xpReward: 70,
              goldReward: 45,
              isFrog: true,
              estimatedMinutes: 45,
              subquests: JSON.stringify([]),
            },
          });
        }

        if (payload.firstDemon && String(payload.firstDemon).trim().length > 0) {
          await prisma.habitDemon.create({
            data: {
              title: String(payload.firstDemon).trim(),
              type: "DEMON",
              stat: "WIL",
              xpValue: 30,
              goldValue: 20,
              hpPenalty: 15,
            },
          });
        }
        break;
      }

      case "UPDATE_PROFILE": {
        await prisma.hunterProfile.update({
          where: { id: "default-hunter" },
          data: {
            name: (payload.name || "Мисливець").trim(),
            hunterClass: (payload.hunterClass || "Стратег").trim(),
            mainGoal: (payload.mainGoal || "").trim(),
            bio: (payload.bio || "").trim(),
          },
        });
        break;
      }

      case "TOGGLE_QUEST": {
        const quest = await prisma.quest.findUnique({ where: { id: payload.id } });
        if (!quest) break;
        const nextCompleted = !quest.completed;
        await prisma.quest.update({
          where: { id: quest.id },
          data: {
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date() : null,
          },
        });

        const frogMultiplier = quest.isFrog ? 2 : 1;
        const xpDelta = (nextCompleted ? 1 : -1) * quest.xpReward * frogMultiplier;
        const goldDelta = (nextCompleted ? 1 : -1) * quest.goldReward * frogMultiplier;
        await applyXpAndGold(
          xpDelta,
          goldDelta,
          nextCompleted ? quest.stat : undefined,
          0,
          quest.isFrog ? (nextCompleted ? 1 : -1) : 0
        );
        break;
      }

      case "CREATE_QUEST": {
        const rank = (payload.rank || "C") as string;
        const reward = RANK_REWARDS[rank] || RANK_REWARDS.C;
        if (payload.isFrog) {
          await prisma.quest.updateMany({
            where: { isFrog: true },
            data: { isFrog: false },
          });
        }
        await prisma.quest.create({
          data: {
            title: payload.title,
            description: payload.description || "",
            rank,
            stat: payload.stat || "INT",
            xpReward: reward.xp,
            goldReward: reward.gold,
            isFrog: Boolean(payload.isFrog),
            estimatedMinutes: Number(payload.estimatedMinutes) || reward.minutes,
            subquests: JSON.stringify(payload.subquests || []),
          },
        });
        break;
      }

      case "DELETE_QUEST": {
        await prisma.quest.delete({ where: { id: payload.id } });
        break;
      }

      case "SET_FROG": {
        await prisma.quest.updateMany({
          where: { isFrog: true },
          data: { isFrog: false },
        });
        await prisma.quest.update({
          where: { id: payload.id },
          data: { isFrog: true },
        });
        break;
      }

      case "TOGGLE_SUBQUEST": {
        const quest = await prisma.quest.findUnique({ where: { id: payload.questId } });
        if (!quest) break;
        const list = JSON.parse(quest.subquests || "[]") as Array<{
          id: string;
          title: string;
          done: boolean;
        }>;
        let becameDone = false;
        const updated = list.map((item) => {
          if (item.id === payload.subquestId) {
            becameDone = !item.done;
            return { ...item, done: becameDone };
          }
          return item;
        });
        await prisma.quest.update({
          where: { id: quest.id },
          data: { subquests: JSON.stringify(updated) },
        });
        if (becameDone) {
          await applyXpAndGold(8, 5);
        }
        break;
      }

      case "SPLIT_QUEST": {
        const quest = await prisma.quest.findUnique({ where: { id: payload.id } });
        if (!quest) break;
        const generated = [
          {
            id: `sq-${Date.now()}-1`,
            title: `Підготувати матеріали та робоче вікно для «${quest.title.slice(0, 32)}» (5 хв)`,
            done: false,
          },
          {
            id: `sq-${Date.now()}-2`,
            title: "Зробити чорновий варіант першої частини без редагування (15 хв)",
            done: false,
          },
          {
            id: `sq-${Date.now()}-3`,
            title: "Виконати основний робочий блок задачі (20 хв)",
            done: false,
          },
          {
            id: `sq-${Date.now()}-4`,
            title: "Перевірити результат і зафіксувати завершення (5 хв)",
            done: false,
          },
        ];
        await prisma.quest.update({
          where: { id: quest.id },
          data: { subquests: JSON.stringify(generated) },
        });
        break;
      }

      case "TOGGLE_DAILY": {
        const daily = await prisma.dailyRitual.findUnique({ where: { id: payload.id } });
        if (!daily) break;
        const nextState = !daily.completedToday;
        const newStreak = nextState ? daily.streak + 1 : Math.max(0, daily.streak - 1);
        await prisma.dailyRitual.update({
          where: { id: daily.id },
          data: {
            completedToday: nextState,
            streak: newStreak,
          },
        });
        const streakBonus = Math.min(2.0, 1 + newStreak * 0.1);
        const xpDelta = Math.round((nextState ? 1 : -1) * daily.xpReward * streakBonus);
        const goldDelta = Math.round((nextState ? 1 : -1) * daily.goldReward * streakBonus);
        await applyXpAndGold(xpDelta, goldDelta, nextState ? daily.stat : undefined);
        break;
      }

      case "CREATE_DAILY": {
        await prisma.dailyRitual.create({
          data: {
            title: payload.title,
            stat: payload.stat || "WIL",
            xpReward: Number(payload.xpReward) || 25,
            goldReward: Number(payload.goldReward) || 15,
            hpPenalty: Number(payload.hpPenalty) || 10,
          },
        });
        break;
      }

      case "DELETE_DAILY": {
        await prisma.dailyRitual.delete({ where: { id: payload.id } });
        break;
      }

      case "NEW_DAY_RESET": {
        const dailies = await prisma.dailyRitual.findMany();
        const profile = await prisma.hunterProfile.findUnique({ where: { id: "default-hunter" } });
        if (!profile) break;

        const missed = dailies.filter((d) => !d.completedToday);
        let shields = profile.freezeShields;
        let hpPenaltyTotal = 0;

        if (missed.length > 0 && dailies.length > 0) {
          if (shields > 0) {
            shields -= 1;
          } else {
            hpPenaltyTotal = missed.reduce((acc, d) => acc + d.hpPenalty, 0);
          }
        }

        for (const d of dailies) {
          await prisma.dailyRitual.update({
            where: { id: d.id },
            data: {
              completedToday: false,
              streak: d.completedToday ? d.streak : shields < profile.freezeShields ? d.streak : 0,
            },
          });
        }

        await prisma.habitDemon.updateMany({
          where: { type: "DEMON" },
          data: { cleanDays: { increment: 1 } },
        });

        await prisma.hunterProfile.update({
          where: { id: "default-hunter" },
          data: {
            freezeShields: shields,
            streakDays:
              dailies.length > 0 && missed.length === 0
                ? profile.streakDays + 1
                : profile.streakDays,
            hp: Math.max(5, profile.hp - hpPenaltyTotal),
          },
        });
        break;
      }

      case "RESIST_URGE": {
        const demon = await prisma.habitDemon.findUnique({ where: { id: payload.id } });
        if (!demon) break;
        await prisma.habitDemon.update({
          where: { id: demon.id },
          data: {
            urgesResisted: demon.urgesResisted + 1,
            lastActionAt: new Date(),
          },
        });
        await applyXpAndGold(demon.xpValue + 10, demon.goldValue + 5, "WIL", 5);
        break;
      }

      case "RELAPSE_DEMON": {
        const demon = await prisma.habitDemon.findUnique({ where: { id: payload.id } });
        if (!demon) break;
        await prisma.habitDemon.update({
          where: { id: demon.id },
          data: {
            relapses: demon.relapses + 1,
            cleanDays: 0,
            lastActionAt: new Date(),
          },
        });
        await applyXpAndGold(0, -10, undefined, -demon.hpPenalty);
        await prisma.quest.create({
          data: {
            title: `Квест спокути: нейтралізувати наслідки «${demon.title.slice(0, 32)}» (10 хв дії)`,
            description:
              "Зрив не обнуляє твій шлях, якщо ти одразу повертаєш контроль. Виконай 10 хвилин корисної праці або вправ.",
            rank: "D",
            stat: "WIL",
            xpReward: 35,
            goldReward: 20,
            isFrog: false,
            estimatedMinutes: 10,
            subquests: JSON.stringify([]),
          },
        });
        break;
      }

      case "TRIGGER_POSITIVE_HABIT": {
        const habit = await prisma.habitDemon.findUnique({ where: { id: payload.id } });
        if (!habit) break;
        await prisma.habitDemon.update({
          where: { id: habit.id },
          data: {
            urgesResisted: habit.urgesResisted + 1,
            cleanDays: habit.cleanDays + 1,
            lastActionAt: new Date(),
          },
        });
        await applyXpAndGold(habit.xpValue, habit.goldValue, habit.stat, 3);
        break;
      }

      case "CREATE_HABIT": {
        await prisma.habitDemon.create({
          data: {
            title: payload.title,
            type: payload.type || "DEMON",
            stat: payload.stat || "WIL",
            xpValue: Number(payload.xpValue) || 25,
            goldValue: Number(payload.goldValue) || 15,
            hpPenalty: payload.type === "POSITIVE" ? 0 : Number(payload.hpPenalty) || 15,
          },
        });
        break;
      }

      case "DELETE_HABIT": {
        await prisma.habitDemon.delete({ where: { id: payload.id } });
        break;
      }

      case "COMPLETE_FOCUS_SESSION": {
        const minutes = Number(payload.minutes) || 25;
        const overdriveMinutes = Number(payload.overdriveMinutes) || 0;
        const baseXp = Math.round(minutes * 2.2);
        const overdriveXp = Math.round(overdriveMinutes * 3.5);
        const totalXp = baseXp + overdriveXp;
        const totalGold = Math.round((minutes + overdriveMinutes * 1.5) * 1.2);

        await prisma.focusSession.create({
          data: {
            questTitle: payload.questTitle || "Фокус-сесія",
            monsterName: payload.monsterName || "Тінь розфокусу",
            minutes,
            overdriveMinutes,
            xpEarned: totalXp,
            goldEarned: totalGold,
            status: "VICTORY",
          },
        });

        await applyXpAndGold(totalXp, totalGold, "INT", 5, 0, minutes + overdriveMinutes);
        break;
      }

      case "DESERT_FOCUS_SESSION": {
        await prisma.focusSession.create({
          data: {
            questTitle: payload.questTitle || "Перерваний раунд",
            monsterName: payload.monsterName || "Тінь розфокусу",
            minutes: Number(payload.minutes) || 0,
            overdriveMinutes: 0,
            xpEarned: 0,
            goldEarned: 0,
            status: "DESERTED",
          },
        });
        await applyXpAndGold(0, 0, undefined, -15);
        break;
      }

      case "ALLOCATE_STAT": {
        const profile = await prisma.hunterProfile.findUnique({ where: { id: "default-hunter" } });
        if (!profile || profile.statPoints <= 0) break;
        const stat = payload.stat as string;
        const data: Record<string, number> = { statPoints: profile.statPoints - 1 };
        if (stat === "STR") data.str = profile.str + 1;
        if (stat === "INT") data.intel = profile.intel + 1;
        if (stat === "DEX") data.dex = profile.dex + 1;
        if (stat === "WIL") data.wil = profile.wil + 1;
        if (stat === "CHA") data.cha = profile.cha + 1;
        await prisma.hunterProfile.update({
          where: { id: "default-hunter" },
          data,
        });
        break;
      }

      case "BUY_TAVERN_ITEM": {
        const item = await prisma.tavernItem.findUnique({ where: { id: payload.id } });
        const profile = await prisma.hunterProfile.findUnique({ where: { id: "default-hunter" } });
        if (!item || !profile || profile.gold < item.cost) break;

        await prisma.tavernItem.update({
          where: { id: item.id },
          data: { ownedCount: item.ownedCount + 1 },
        });

        const profileUpdate: Record<string, number> = {
          gold: profile.gold - item.cost,
        };
        if (item.effectType === "HEAL_HP") {
          profileUpdate.hp = Math.min(profile.maxHp, profile.hp + 40);
        } else if (item.effectType === "SHIELD") {
          profileUpdate.freezeShields = profile.freezeShields + 1;
        }

        await prisma.hunterProfile.update({
          where: { id: "default-hunter" },
          data: profileUpdate,
        });
        break;
      }

      case "CREATE_TAVERN_ITEM": {
        await prisma.tavernItem.create({
          data: {
            title: payload.title,
            description: payload.description || "Власна нагорода за виконану роботу.",
            category: "REAL_REWARD",
            cost: Number(payload.cost) || 150,
            icon: "reward",
            effectType: "CUSTOM",
          },
        });
        break;
      }

      case "DELETE_TAVERN_ITEM": {
        await prisma.tavernItem.delete({ where: { id: payload.id } });
        break;
      }

      case "SUBMIT_REFLECTION": {
        const xpReward = 60;
        const goldReward = 30;
        await prisma.reflectionLog.create({
          data: {
            dateLabel: new Date().toLocaleDateString("uk-UA", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            moodScore: Number(payload.moodScore) || 4,
            energyScore: Number(payload.energyScore) || 4,
            wins: payload.wins || "",
            blockers: payload.blockers || "",
            tomorrowFrog: payload.tomorrowFrog || "",
            xpEarned: xpReward,
          },
        });

        if (payload.tomorrowFrog && payload.tomorrowFrog.trim().length > 2) {
          await prisma.quest.updateMany({
            where: { isFrog: true },
            data: { isFrog: false },
          });
          await prisma.quest.create({
            data: {
              title: payload.tomorrowFrog.trim(),
              description: "Головна задача дня, запланована під час вечірнього підсумку.",
              rank: "A",
              stat: "INT",
              xpReward: 110,
              goldReward: 70,
              isFrog: true,
              estimatedMinutes: 45,
              subquests: JSON.stringify([]),
            },
          });
        }

        await applyXpAndGold(xpReward, goldReward, "WIL", 15);
        break;
      }
    }

    const updatedState = await getFullState();
    return NextResponse.json(updatedState);
  } catch (error) {
    console.error("POST /api/rpg error:", error);
    return NextResponse.json({ error: "Failed to process RPG action" }, { status: 500 });
  }
}
