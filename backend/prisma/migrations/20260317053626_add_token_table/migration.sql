-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('REFRESH', 'EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_value_key" ON "Token"("value");

-- CreateIndex
CREATE INDEX "Token_value_idx" ON "Token"("value");

-- CreateIndex
CREATE INDEX "Token_userId_type_idx" ON "Token"("userId", "type");

-- CreateIndex
CREATE INDEX "Token_expiresAt_idx" ON "Token"("expiresAt");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
