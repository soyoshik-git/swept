import { CheckCircle2, Coins, AlertCircle, Trophy } from "lucide-react";

type Props = {
  completionCount: number;
  myTotalPoint: number;
  myPenaltyCount: number;
  myRank: number;
};

export function TaskOverview({ completionCount, myTotalPoint, myPenaltyCount, myRank }: Props) {
  const stats = [
    {
      label: "完了",
      value: completionCount,
      icon: CheckCircle2,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "獲得pt",
      value: myTotalPoint.toLocaleString(),
      icon: Coins,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "ペナルティ",
      value: myPenaltyCount,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "順位",
      value: myRank > 0 ? `${myRank}位` : "—",
      icon: Trophy,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center p-3 rounded-2xl bg-card shadow-sm"
        >
          <div className={`p-2 rounded-xl ${stat.bgColor} mb-2`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
