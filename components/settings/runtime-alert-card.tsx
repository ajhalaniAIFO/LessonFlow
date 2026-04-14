import type { RuntimeAlert } from "@/lib/runtime/runtime-alerts";

type Props = {
  alerts: RuntimeAlert[];
};

export function SettingsRuntimeAlertCard({ alerts }: Props) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="runtime-alert-list">
      {alerts.map((alert) => (
        <div
          key={`${alert.level}-${alert.headline}`}
          className={`status-box ${alert.level === "warning" ? "error" : "success"}`}
        >
          <p className="status-title">{alert.headline}</p>
          <p className="status-copy">{alert.message}</p>
        </div>
      ))}
    </div>
  );
}
