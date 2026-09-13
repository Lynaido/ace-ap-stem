import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { z } from 'zod';
import logger from '../config/logger';

// Identifiers are validated by shape rather than a fixed list so new outfits,
// moods and accessories can ship from the frontend without a backend release.
const identifier = z.string().regex(/^[a-z0-9-]{1,40}$/, 'Invalid identifier');

const appearanceSchema = z.object({
  outfitId: identifier.optional(),
  moodId: identifier.optional(),
  accessoriesEnabled: z.boolean().optional(),
}).strict();

const preferencesSchema = z.object({
  minimized: z.boolean().optional(),
  bubblesEnabled: z.boolean().optional(),
}).strict();

const onboardingSchema = z.object({
  status: z.enum(['completed', 'skipped', 'dismissed']),
}).strict();

const updateCompanionSchema = z.object({
  appearance: appearanceSchema.optional(),
  preferences: preferencesSchema.optional(),
  onboarding: onboardingSchema.optional(),
}).strict();

type CompanionSection = Record<string, unknown>;

export interface CompanionProfile {
  appearance: CompanionSection;
  preferences: CompanionSection;
  onboarding: CompanionSection | null;
  updatedAt: string | null;
}

const asSection = (value: unknown): CompanionSection => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as CompanionSection : {}
);

export const normalizeCompanionProfile = (value: unknown): CompanionProfile => {
  const stored = asSection(value);
  const onboarding = asSection(stored.onboarding);
  return {
    appearance: asSection(stored.appearance),
    preferences: asSection(stored.preferences),
    onboarding: Object.keys(onboarding).length ? onboarding : null,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : null,
  };
};

// Each section is merged independently so saving a new outfit cannot erase the
// learner's onboarding progress, and vice versa.
export const mergeCompanionProfile = (
  current: CompanionProfile,
  update: z.infer<typeof updateCompanionSchema>,
  now = new Date()
): CompanionProfile => ({
  appearance: { ...current.appearance, ...(update.appearance || {}) },
  preferences: { ...current.preferences, ...(update.preferences || {}) },
  onboarding: update.onboarding
    ? { status: update.onboarding.status, updatedAt: now.toISOString() }
    : current.onboarding,
  updatedAt: now.toISOString(),
});

/**
 * GET /api/companion
 * Get the authenticated learner's Acey profile
 */
export const getCompanionProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companionProfile: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: normalizeCompanionProfile(user.companionProfile)
    });
  } catch (error) {
    logger.error('Error fetching companion profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch companion profile'
    });
  }
};

/**
 * PUT /api/companion
 * Merge appearance, preferences or onboarding progress into the Acey profile
 */
export const updateCompanionProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const update = updateCompanionSchema.parse(req.body);

    const profile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { companionProfile: true }
      });

      if (!user) return null;

      const merged = mergeCompanionProfile(normalizeCompanionProfile(user.companionProfile), update);
      await tx.user.update({
        where: { id: userId },
        data: { companionProfile: merged as unknown as Prisma.InputJsonValue }
      });
      return merged;
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    logger.error('Error updating companion profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update companion profile'
    });
  }
};
