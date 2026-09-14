-- Acey study-buddy customization and onboarding state. Nullable and additive:
-- existing users keep working and receive defaults until they customize Acey.
ALTER TABLE "users" ADD COLUMN "companionProfile" JSONB;
