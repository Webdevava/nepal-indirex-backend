import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

// Sample data generation helpers
const devices = ['R-1001', 'R-1002', 'R-1003'];
const channels = [
  { name: 'Global TV', score: 0.81 },
  { name: 'Nepal TV', score: 0.85 },
  { name: 'Kantipur TV', score: 0.78 },
];
const ads = [
  { name: 'Shivam Cement', score: 0.96 },
  { name: 'Dabur Honey', score: 0.92 },
  { name: 'Wai Wai Noodles', score: 0.94 },
];

// Generate random timestamp within the last 7 days
const getRandomTimestamp = (): bigint => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const randomTime = sevenDaysAgo + Math.random() * (now - sevenDaysAgo);
  return BigInt(Math.floor(randomTime / 1000)); // Convert to seconds
};

// Generate random subset of array
const getRandomSubset = <T>(arr: T[], min: number, max: number): T[] => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Generate event data with varying channel/ad combinations
const generateEventData = (deviceId: string) => {
  const hasChannel = Math.random() > 0.3; // 70% chance of having a channel
  const hasAds = Math.random() > 0.4; // 60% chance of having ads
  const eventChannels = hasChannel ? getRandomSubset(channels, 1, 1) : [];
  const eventAds = hasAds ? getRandomSubset(ads, 1, 3) : [];
  const maxScore = eventAds.length > 0 ? Math.max(...eventAds.map(ad => ad.score)) : null;
  const imagePath = hasAds || hasChannel 
    ? `https://apm-captured-images.s3.ap-south-1.amazonaws.com/Nepal_Frames/analyzed_frames/${deviceId}/${deviceId}_${getRandomTimestamp()}_recognized.jpg`
    : null;

  return {
    device_id: deviceId,
    timestamp: getRandomTimestamp(),
    type: 29,
    image_path: imagePath,
    max_score: maxScore,
    ads: eventAds,
    channels: eventChannels,
  };
};

async function seedEvents() {
  try {
    logger.info('Starting event seeding...');

    // Generate 50 events across the three devices
    const eventCountPerDevice = Math.floor(50 / devices.length);
    const eventsData = devices.flatMap(deviceId => 
      Array.from({ length: eventCountPerDevice }, () => generateEventData(deviceId))
    );

    // Shuffle events to mix device IDs
    eventsData.sort(() => Math.random() - 0.5);

    // Batch events into groups of 10 to avoid transaction timeout
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < eventsData.length; i += batchSize) {
      batches.push(eventsData.slice(i, i + batchSize));
    }

    let totalCreated = 0;
    for (const [index, batch] of batches.entries()) {
      logger.info(`Processing batch ${index + 1} of ${batches.length}...`);
      
      const createdEvents = await prisma.$transaction(
        async (tx) => {
          const results = [];
          for (const eventData of batch) {
            // Generate unique ID with retry logic
            let eventId: bigint;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
              eventId = BigInt(Math.floor(Math.random() * 1000000) + 100000);
              try {
                const event = await tx.event.create({
                  data: {
                    id: eventId,
                    device_id: eventData.device_id,
                    timestamp: eventData.timestamp,
                    type: eventData.type,
                    image_path: eventData.image_path,
                    max_score: eventData.max_score,
                    created_at: new Date(),
                    ads: {
                      create: eventData.ads.map(ad => ({
                        name: ad.name,
                        score: ad.score,
                      })),
                    },
                    channels: {
                      create: eventData.channels.map(channel => ({
                        name: channel.name,
                        score: channel.score,
                      })),
                    },
                  },
                  include: {
                    ads: true,
                    channels: true,
                  },
                });
                results.push(event);
                break;
              } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                  attempts++;
                  if (attempts === maxAttempts) {
                    throw new Error(`Failed to generate unique event ID for device ${eventData.device_id} after ${maxAttempts} attempts`);
                  }
                  continue;
                }
                throw error;
              }
            }
          }
          return results;
        },
        {
          maxWait: 10000, // Wait up to 10 seconds to start transaction
          timeout: 15000, // Allow 15 seconds for transaction completion
        }
      );

      totalCreated += createdEvents.length;
      logger.info(`Batch ${index + 1} completed: ${createdEvents.length} events created`);
    }

    logger.info(`Successfully seeded ${totalCreated} events across ${batches.length} batches.`);
  } catch (error) {
    logger.error('Error seeding events:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding script
seedEvents().catch((e) => {
  console.error(e);
  process.exit(1);
});