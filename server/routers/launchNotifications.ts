import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { subscribeToLaunchNotifications } from "../db";

const emailInput = z.object({
  email: z.string().trim().email().max(320),
});

export const launchNotificationsRouter = router({
  subscribe: publicProcedure.input(emailInput).mutation(async ({ input }) => {
    const result = await subscribeToLaunchNotifications(input.email);
    return {
      ...result,
      message: result.alreadySubscribed ? "该邮箱已订阅主网上线更新。" : "订阅成功；主网上线时我们会按计划发送通知。",
      deliveryStarted: false,
    } as const;
  }),
});
