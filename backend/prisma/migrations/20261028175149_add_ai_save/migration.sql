-- CreateTable
CREATE TABLE "AiSave" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" JSONB NOT NULL,

    CONSTRAINT "AiSave_pkey" PRIMARY KEY ("id")
);
