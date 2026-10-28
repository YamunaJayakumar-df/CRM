-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Security (added by hand): turn on Row Level Security with NO policies.
-- This blocks Supabase's public Data API from reading or changing this table.
-- Our backend connects as the table owner, which RLS does not restrict,
-- so all access goes through the backend's own checks.
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
