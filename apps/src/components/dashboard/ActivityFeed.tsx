import React from 'react';

interface Activity {
  id: string;
  icon: string;
  text: string;
  time: string;
}

interface ActivityFeedProps {
  items: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-lg">
        Belum ada aktivitas.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-md py-sm border-b border-surface-variant last:border-b-0">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px] mt-0.5">{item.icon}</span>
          <div className="flex-1">
            <p className="font-body-sm text-body-sm text-on-surface">{item.text}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
