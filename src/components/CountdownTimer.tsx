import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endDate: string;
  onExpire?: () => void;
  className?: string;
}

export const CountdownTimer = ({ endDate, onExpire, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onExpire?.();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 animate-pulse" />
      <div className="flex items-center gap-1 font-mono font-semibold">
        {timeLeft.days > 0 && (
          <>
            <span className="bg-primary/20 px-2 py-1 rounded text-sm">
              {String(timeLeft.days).padStart(2, '0')}d
            </span>
            <span>:</span>
          </>
        )}
        <span className="bg-primary/20 px-2 py-1 rounded text-sm">
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        <span>:</span>
        <span className="bg-primary/20 px-2 py-1 rounded text-sm">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        <span>:</span>
        <span className="bg-primary/20 px-2 py-1 rounded text-sm">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
};
