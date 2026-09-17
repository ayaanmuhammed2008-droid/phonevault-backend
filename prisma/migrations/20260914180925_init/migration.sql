-- CreateTable
CREATE TABLE "phones" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "description" TEXT,
    "imageUrl" TEXT,
    "displaySize" DOUBLE PRECISION,
    "displayType" TEXT,
    "resolution" TEXT,
    "refreshRate" INTEGER,
    "processor" TEXT,
    "gpu" TEXT,
    "ram" INTEGER,
    "storage" INTEGER,
    "operatingSystem" TEXT,
    "mainCamera" TEXT,
    "ultrawideCamera" TEXT,
    "telephotoCamera" TEXT,
    "frontCamera" TEXT,
    "videoRecording" TEXT,
    "batteryCapacity" INTEGER,
    "chargingSpeed" TEXT,
    "wirelessCharging" BOOLEAN NOT NULL DEFAULT false,
    "network" TEXT,
    "wifi" TEXT,
    "bluetooth" TEXT,
    "nfc" BOOLEAN NOT NULL DEFAULT false,
    "usb" TEXT,
    "fiveG" BOOLEAN NOT NULL DEFAULT false,
    "dimensions" TEXT,
    "weight" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phones_slug_key" ON "phones"("slug");

-- CreateIndex
CREATE INDEX "phones_brand_idx" ON "phones"("brand");

-- CreateIndex
CREATE INDEX "phones_model_idx" ON "phones"("model");

-- CreateIndex
CREATE INDEX "phones_price_idx" ON "phones"("price");

-- CreateIndex
CREATE INDEX "phones_brand_model_idx" ON "phones"("brand", "model");
