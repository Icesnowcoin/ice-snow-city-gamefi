import { useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export interface ShareStatisticsData {
  transactionId?: string | number;
  platform: 'twitter' | 'telegram' | 'clipboard' | 'download';
  transactionType?: string;
  amount?: string | number;
}

/**
 * Hook for tracking share statistics
 * Records sharing events to the database via tRPC
 */
export function useShareStatistics() {
  const recordShareMutation = trpc.shareStatistics.recordShare.useMutation();

  /**
   * Record a share event
   */
  const recordShare = useCallback(
    async (data: ShareStatisticsData) => {
      try {
        const result = await recordShareMutation.mutateAsync({
          transactionId: data.transactionId ? Number(data.transactionId) : undefined,
          platform: data.platform,
          transactionType: data.transactionType,
          amount: data.amount ? String(data.amount) : undefined,
        });

        // Show success toast
        const platformLabel = {
          twitter: 'Twitter',
          telegram: 'Telegram',
          clipboard: '剪贴板',
          download: '下载',
        }[data.platform];

        toast.success(`分享到 ${platformLabel} 成功`, {
          description: '分享记录已保存',
        });

        return result;
      } catch (error) {
        console.error('Failed to record share:', error);
        toast.error('分享记录失败', {
          description: '无法保存分享数据，请稍后重试',
        });
        throw error;
      }
    },
    [recordShareMutation]
  );

  return {
    recordShare,
    isRecording: recordShareMutation.isPending,
  };
}
