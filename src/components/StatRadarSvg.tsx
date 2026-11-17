"use client";

import React from "react";
import { HunterProfile, StatType } from "@/types/rpg";
import {
  Plus,
  Dumbbell,
  Cpu,
  Gauge,
  Shield,
  Users,
  Sliders,
} from "lucide-react";

interface StatRadarSvgProps {
  profile: HunterProfile;
  onAllocateStat: (stat: StatType) => void;
}

const STAT_META: Array<{
  key: StatType;
  field: keyof HunterProfile;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}> = [
  { key: "STR", field: "str", label: "Сила (STR)", desc: "Спорт, тіло, витривалість", icon: Dumbbell },
  { key: "INT", field: "intel", label: "Інтелект (INT)", desc: "Навчання, аналіз, складні задачі", icon: Cpu },
  { key: "DEX", field: "dex", label: "Спритність (DEX)", desc: "Побут, швидкість, порядок", icon: Gauge },
  { key: "WIL", field: "wil", label: "Воля (WIL)", desc: "Дисципліна, опір зривам", icon: Shield },
  { key: "CHA", field: "cha", label: "Харизма (CHA)", desc: "Комунікація, творчість, відновлення", icon: Users },
];

export function StatRadarSvg({ profile, onAllocateStat }: StatRadarSvgProps) {
  const size = 220;
  const center = size / 2;
  const radius = 72;

  const values = STAT_META.map((s) => Number(profile[s.field]) || 10);
  const maxStat = Math.max(24, ...values);

  const getPoint = (index: number, normalized: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const r = radius * normalized;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = values
    .map((val, idx) => {
      const ratio = Math.min(1, Math.max(0.2, val / maxStat));
      const pt = getPoint(idx, ratio);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section aria-labelledby="hunter-stats-heading" className="well">
      <div className="panel-head">
        <div className="panel-title-group">
          <Sliders className="icon-accent h-4 w-4" aria-hidden={true} />
          <h2 id="hunter-stats-heading">Характеристики</h2>
        </div>
        {profile.statPoints > 0 && (
          <span className="tag-chip tag-chip--amber">
            +{profile.statPoints} очок
          </span>
        )}
      </div>

      <div className="my-4 flex flex-col items-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Діаграма п'яти характеристик персонажа"
          className="overflow-visible"
        >
          {[0.33, 0.66, 1].map((ring) => {
            const pts = [0, 1, 2, 3, 4]
              .map((i) => {
                const p = getPoint(i, ring);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(" ");
            return (
              <polygon
                key={ring}
                points={pts}
                fill="none"
                stroke="var(--color-rule-2)"
                strokeWidth="1"
              />
            );
          })}

          {[0, 1, 2, 3, 4].map((i) => {
            const p = getPoint(i, 1);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke="var(--color-rule)"
                strokeWidth="1"
              />
            );
          })}

          <polygon
            points={polygonPoints}
            fill="var(--color-accent-soft)"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />

          {STAT_META.map((stat, idx) => {
            const val = Number(profile[stat.field]) || 10;
            const ratio = Math.min(1, Math.max(0.2, val / maxStat));
            const dot = getPoint(idx, ratio);
            const labelPos = getPoint(idx, 1.25);
            return (
              <g key={stat.key}>
                <circle cx={dot.x} cy={dot.y} r="3.5" fill="var(--color-accent)" />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--color-ink-2)"
                  fontSize="11"
                  fontWeight="500"
                >
                  {stat.key} {val}
                </text>
              </g>
            );
          })}
        </svg>

        <table className="visually-hidden">
          <caption>Таблиця характеристик персонажа</caption>
          <thead>
            <tr>
              <th scope="col">Характеристика</th>
              <th scope="col">Значення</th>
              <th scope="col">Призначення</th>
            </tr>
          </thead>
          <tbody>
            {STAT_META.map((stat) => (
              <tr key={stat.key}>
                <td>{stat.label}</td>
                <td>{String(profile[stat.field])}</td>
                <td>{stat.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="rule-list">
        {STAT_META.map((stat) => {
          const val = Number(profile[stat.field]) || 10;
          const Icon = stat.icon;
          return (
            <li key={stat.key} className="rule-row flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Icon className="icon-muted mt-1 h-4 w-4" aria-hidden={true} />
                <div>
                  <h3>{stat.label}</h3>
                  <p className="small-meta">{stat.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="reading">{val}</span>
                {profile.statPoints > 0 && (
                  <button
                    type="button"
                    onClick={() => onAllocateStat(stat.key)}
                    aria-label={`Додати очко до ${stat.label}`}
                    className="btn btn--subtle"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden={true} />
                    <span>+1</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
